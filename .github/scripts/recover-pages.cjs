// Usa apenas a API oficial de cancelamento do Pages; não apaga deployments ou o site.
module.exports = async function recover({ github, context, core, mode, sha,
  pause = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  const repo = context.repo;
  if (!['inspect', 'cancel-if-stuck'].includes(mode) || !/^[a-f0-9]{40}$/i.test(sha || '')) {
    throw new Error('Informe modo válido e o SHA completo de 40 caracteres do commit antigo.');
  }
  const notes = ['# Diagnóstico do GitHub Pages', `Commit investigado: \`${sha}\`.`,
    'Esta execução não publica conteúdo e não apaga o ambiente ou o site.'];
  try {
    // O commit precisa existir e ser antigo; nunca cancelar o deploy da versão atual.
    const commit = await github.rest.repos.getCommit({ ...repo, ref: sha });
    if (commit.data.sha.toLowerCase() !== sha.toLowerCase()) throw new Error('SHA não confirmado.');
    const head = await github.rest.repos.getBranch({ ...repo, branch: 'main' });
    if (head.data.commit.sha.toLowerCase() === sha.toLowerCase()) {
      throw new Error('Recusado: este commit é a versão atual de main.');
    }
    const deployments = await github.paginate(github.rest.repos.listDeployments,
      { ...repo, environment: 'github-pages', per_page: 100 });
    notes.push('## Deployments do ambiente github-pages', '| ID | Commit | Último estado |', '| --- | --- | --- |');
    for (const deployment of deployments) {
      const statuses = await github.rest.repos.listDeploymentStatuses(
        { ...repo, deployment_id: deployment.id, per_page: 1 });
      const state = statuses.data[0]?.state || 'sem status';
      notes.push(`| ${deployment.id} | ${deployment.sha} | ${state} |`);
    }
    if (!deployments.length) notes.push('Nenhum deployment genérico encontrado. O backend do Pages é consultado separadamente abaixo.');
    const runs = await github.paginate(github.rest.actions.listWorkflowRunsForRepo,
      { ...repo, head_sha: sha, per_page: 100 });
    const active = runs.filter(run => run.status !== 'completed');
    notes.push(`Execuções associadas ao commit: ${runs.length}; ainda não concluídas: ${active.length}.`);
    // A ação oficial permite consultar pelo ID retornado ou pelo build_version (SHA).
    // O erro do Pages pode mostrar somente os prefixo do SHA indicado no erro (nove caracteres neste caso) do SHA.
    let id;
    let state;
    for (const candidate of [sha, sha.slice(0, 9)]) {
      try {
        const response = await github.request('GET /repos/{owner}/{repo}/pages/deployments/{deployment_id}',
          { ...repo, deployment_id: candidate });
        id = candidate;
        state = response.data.status;
        break;
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }
    if (!id) throw new Error('Deployment não localizado no backend do Pages. Nenhum cancelamento foi feito. Confira o identificador no log original.');
    notes.push(`## Backend do Pages`, `Identificador consultado: \`${id}\`; estado: \`${state}\`.`);
    core.info(`Pages ${id}: ${state}; execuções associadas ativas: ${active.length}`);
    if (mode === 'inspect') {
      notes.push('Modo de consulta: nenhum cancelamento solicitado.');
      return;
    }
    const pending = new Set(['deployment_in_progress', 'syncing_files', 'finished_file_sync', 'updating_pages', 'purging_cdn', 'deployment_attempt_error']);
    const terminal = new Set(['succeed', 'deployment_cancelled', 'deployment_failed', 'deployment_content_failed', 'deployment_perms_error', 'deployment_lost']);
    if (terminal.has(state)) {
      notes.push('O deployment já está encerrado. Nenhum cancelamento necessário; não foi iniciado novo deploy.');
      return;
    }
    if (!pending.has(state)) throw new Error(`Estado desconhecido (${state}); cancelamento recusado.`);
    if (active.length) throw new Error('Ainda existe execução não concluída para esse commit. Cancelamento recusado para não interromper trabalho ativo.');
    await github.request('POST /repos/{owner}/{repo}/pages/deployments/{deployment_id}/cancel',
      { ...repo, deployment_id: id });
    notes.push('Cancelamento solicitado exclusivamente para o deployment antigo.');
    for (let attempt = 0; attempt < 10; attempt++) {
      await pause(3000);
      const response = await github.request('GET /repos/{owner}/{repo}/pages/deployments/{deployment_id}',
        { ...repo, deployment_id: id });
      state = response.data.status;
      if (terminal.has(state)) {
        notes.push(`Estado final confirmado: \`${state}\`. Nenhum novo deploy foi executado.`);
        core.info(`Estado final confirmado: ${state}`);
        return;
      }
    }
    throw new Error(`O cancelamento foi solicitado, mas o estado ainda é ${state}. Não inicie outro deploy até confirmar o encerramento.`);
  } catch (error) {
    notes.push(`## Operação interrompida`, 'Consulte o erro no log. Nenhum novo deploy foi iniciado.');
    throw error;
  } finally {
    await core.summary.addRaw(notes.join('\n\n')).write();
  }
};
