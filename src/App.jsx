import { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref, remove, set, update } from 'firebase/database';
import { db } from './firebase';

const CIDADES = ['NATAL - RN', 'MOSSORÓ - RN', 'FORTALEZA - CE', 'RECIFE - PE'];
const STATUS_ROTA = ['EM CONSTRUÇÃO', 'TENTANDO ACESSO', 'CONSTRUÍDO', 'ACESSO NEGADO', 'OBSTRUÇÃO', 'FOLGA', 'FERIAS'];
const MENU = [
  ['dashboard', '▦', 'Dashboard'],
  ['rota', '⇄', 'Rota diária'],
  ['base', '⌕', 'Base geral'],
  ['historico', '◴', 'Histórico'],
  ['proximas', '➜', 'Próximas rotas'],
  ['metas', '◎', 'Metas e equipes'],
  ['config', '⚙', 'Configurações'],
];

const normalizar = (v = '') => String(v).trim().toUpperCase();
const cidadeCurta = (v = '') => String(v).split(' - ')[0].trim();
const hojeISO = () => new Date().toISOString().slice(0, 10);
const ts = () => Date.now();
const isConstruido = (s) => normalizar(s).includes('CONSTRU');
const isBloqueio = (s) => ['ACESSO NEGADO', 'OBSTRUÇÃO'].includes(normalizar(s));
const codigoEndereco = (endereco = '') => {
  const m = String(endereco).trim().match(/^(\d{6,12})/);
  return m ? m[1] : '';
};
const fmtData = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('pt-BR');
};
const objetoLista = (obj) => Object.entries(obj || {}).map(([id, value]) => ({ id, ...value }));

function useCaminho(path) {
  const [valor, setValor] = useState({});
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    const unsubscribe = onValue(ref(db, path), (snap) => {
      setValor(snap.val() || {});
      setCarregando(false);
    });
    return unsubscribe;
  }, [path]);
  return [valor, carregando];
}

async function auditar(acao, detalhes) {
  await push(ref(db, 'auditoria'), { acao, detalhes, dataHora: ts() });
}

function App() {
  const [pagina, setPagina] = useState('dashboard');
  const [rotaObj, carregandoRota] = useCaminho('rotaAtual');
  const [baseObj, carregandoBase] = useCaminho('baseGeral');
  const [histObj] = useCaminho('historicoRota');
  const [proxObj] = useCaminho('proximasRotas');

  const rota = useMemo(() => objetoLista(rotaObj).sort((a, b) => String(a.cidade).localeCompare(String(b.cidade))), [rotaObj]);
  const base = useMemo(() => objetoLista(baseObj), [baseObj]);
  const historico = useMemo(() => objetoLista(histObj).sort((a, b) => (b.dataHora || 0) - (a.dataHora || 0)), [histObj]);
  const proximas = useMemo(() => objetoLista(proxObj).sort((a, b) => (a.prioridade || 99) - (b.prioridade || 99)), [proxObj]);

  async function consolidarNaBase(item, novoStatus) {
    if (!isConstruido(novoStatus)) return;
    const codigo = item.codigoImovel || codigoEndereco(item.endereco);
    const existente = base.find((x) => codigo && String(x.codigoImovel || '') === String(codigo));
    const registro = {
      cidade: cidadeCurta(item.cidade),
      equipe: [item.tecnico, item.auxiliar].filter(Boolean).join(' E '),
      tipoProjeto: item.tipoProjeto || '',
      sinergia: item.sinergia || '',
      codigoImovel: codigo || '',
      endereco: item.endereco || '',
      nome: item.nome || '',
      hps: Number(item.hps || 0),
      construcao: new Date().toISOString(),
      mes: new Date().toLocaleDateString('pt-BR', { month: 'long', year: '2-digit' }),
      status: 'Construído/Liberado',
      observacao: item.observacao || '',
      atualizadoEm: ts(),
      origem: 'rotaAtual',
    };
    if (existente) await update(ref(db, `baseGeral/${existente.id}`), registro);
    else await push(ref(db, 'baseGeral'), registro);
  }

  async function registrarHistorico(item, status) {
    if (!isBloqueio(status)) return;
    await push(ref(db, 'historicoRota'), {
      dataHora: ts(), cidade: item.cidade || '', dataRota: hojeISO(), equipe: [item.tecnico, item.auxiliar].filter(Boolean).join(' E '),
      endereco: item.endereco || '', hps: Number(item.hps || 0), blocos: Number(item.blocos || 0), status,
      dataInicio: item.dataInicio || '', sinergia: item.sinergia || '', observacao: 'Registrado automaticamente pelo sistema',
    });
  }

  async function alterarRota(id, campo, valor) {
    const item = rota.find((x) => x.id === id);
    if (!item) return;
    await update(ref(db, `rotaAtual/${id}`), { [campo]: valor, atualizadoEm: ts() });
    if (campo === 'status') {
      await consolidarNaBase(item, valor);
      await registrarHistorico(item, valor);
    }
    await auditar('ALTERAR_ROTA', `${item.tecnico || 'Equipe'} · ${campo}: ${valor}`);
  }

  if (carregandoRota || carregandoBase) return <div className="loading"><div className="loader"/><b>Carregando TechNET Rotas...</b></div>;

  const props = { rota, base, historico, proximas, alterarRota };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">T</span><div><strong>TechNET</strong><small>Rotas MDU</small></div></div>
        <nav>{MENU.map(([id, icon, label]) => <button key={id} className={pagina === id ? 'active' : ''} onClick={() => setPagina(id)}><span>{icon}</span>{label}</button>)}</nav>
        <div className="sidebar-foot"><small>Base migrada da planilha</small><b>MDU 2026</b></div>
      </aside>
      <main className="main">
        <header className="topbar"><div><p>Operação MDU</p><h1>{MENU.find((m) => m[0] === pagina)?.[2]}</h1></div><div className="top-actions"><span className="live-dot"/>Dados em tempo real <div className="avatar">AD</div></div></header>
        <section className="content">
          {pagina === 'dashboard' && <Dashboard {...props} />}
          {pagina === 'rota' && <RotaDiaria {...props} />}
          {pagina === 'base' && <BaseGeral {...props} />}
          {pagina === 'historico' && <Historico {...props} />}
          {pagina === 'proximas' && <ProximasRotas {...props} />}
          {pagina === 'metas' && <Metas {...props} />}
          {pagina === 'config' && <Configuracoes />}
        </section>
      </main>
    </div>
  );
}

function Dashboard({ rota, base }) {
  const ativos = rota.filter((x) => !['FOLGA', 'FERIAS'].includes(normalizar(x.status)));
  const hps = ativos.reduce((s, x) => s + Number(x.hps || 0), 0);
  const blocos = ativos.reduce((s, x) => s + Number(x.blocos || 0), 0);
  const construidos = ativos.filter((x) => isConstruido(x.status)).length;
  const alertas = ativos.filter((x) => {
    if (normalizar(x.status) !== 'TENTANDO ACESSO' || !x.dataInicio) return false;
    const dias = (Date.now() - new Date(x.dataInicio).getTime()) / 86400000;
    return dias >= 2;
  });
  const cards = [['HPs em rota', hps, '∑'], ['Blocos em rota', blocos, '▦'], ['Construídos hoje', construidos, '✓'], ['Alertas de acesso', alertas.length, '!']];
  return <>
    <div className="kpi-grid">{cards.map(([t, v, i]) => <div className="kpi" key={t}><div><small>{t}</small><strong>{v}</strong></div><span>{i}</span></div>)}</div>
    <div className="grid-2">
      <div className="panel"><PanelTitle titulo="Situação por cidade" subtitulo="Rota operacional atual"/><div className="city-list">{CIDADES.map((c) => {
        const itens = ativos.filter((x) => normalizar(x.cidade).startsWith(normalizar(cidadeCurta(c))));
        const total = itens.reduce((s, x) => s + Number(x.hps || 0), 0);
        return <div className="city-row" key={c}><div><b>{cidadeCurta(c)}</b><small>{itens.length} equipes</small></div><div className="bar"><i style={{ width: `${Math.min(100, total / 4)}%` }}/></div><strong>{total} HPs</strong></div>;
      })}</div></div>
      <div className="panel"><PanelTitle titulo="Alertas operacionais" subtitulo="Itens que exigem ação"/>{alertas.length ? <div className="alerts">{alertas.map((a) => <div className="alert" key={a.id}><span>!</span><div><b>{a.tecnico} / {a.auxiliar}</b><small>{a.endereco || 'Endereço não informado'} · tentando acesso desde {fmtData(a.dataInicio)}</small></div></div>)}</div> : <Empty texto="Nenhum alerta crítico de acesso."/>}</div>
    </div>
    <div className="panel"><PanelTitle titulo="Resumo da base histórica" subtitulo="Consolidado migrado da aba Geral"/><div className="history-summary"><div><small>Registros</small><b>{base.length}</b></div><div><small>Construídos/Liberados</small><b>{base.filter((x) => normalizar(x.status).includes('LIBER')).length}</b></div><div><small>HPs históricos</small><b>{base.reduce((s, x) => s + Number(x.hps || 0), 0).toLocaleString('pt-BR')}</b></div><div><small>Cidades</small><b>{new Set(base.map((x) => x.cidade).filter(Boolean)).size}</b></div></div></div>
  </>;
}

function RotaDiaria({ rota, alterarRota }) {
  const [cidade, setCidade] = useState('TODAS');
  const [novo, setNovo] = useState(false);
  const filtrada = cidade === 'TODAS' ? rota : rota.filter((x) => normalizar(x.cidade).startsWith(normalizar(cidadeCurta(cidade))));
  return <>
    <div className="toolbar"><div className="segmented"><button className={cidade === 'TODAS' ? 'on' : ''} onClick={() => setCidade('TODAS')}>Todas</button>{CIDADES.map((c) => <button className={cidade === c ? 'on' : ''} onClick={() => setCidade(c)} key={c}>{cidadeCurta(c)}</button>)}</div><button className="primary" onClick={() => setNovo(!novo)}>+ Adicionar equipe</button></div>
    {novo && <NovaRota onClose={() => setNovo(false)} />}
    <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Fusão</th><th>Equipe</th><th>Endereço</th><th>HPs</th><th>Blocos</th><th>Status</th><th>Início</th><th>Sinergia</th><th>Projeto</th></tr></thead><tbody>{filtrada.map((x) => <tr key={x.id}><td><input type="checkbox" checked={!!x.maquinaFusao} onChange={(e) => alterarRota(x.id, 'maquinaFusao', e.target.checked)}/></td><td><b>{x.tecnico || '—'}</b><small>{x.auxiliar || 'Sem auxiliar'}<br/>{cidadeCurta(x.cidade)}</small></td><td className="address">{x.endereco || '—'}</td><td><InlineNumero value={x.hps} onChange={(v) => alterarRota(x.id, 'hps', v)}/></td><td><InlineNumero value={x.blocos} onChange={(v) => alterarRota(x.id, 'blocos', v)}/></td><td><select className={`status ${normalizar(x.status).replace(/\s+/g, '-').toLowerCase()}`} value={x.status || ''} onChange={(e) => alterarRota(x.id, 'status', e.target.value)}><option value="">Selecione</option>{STATUS_ROTA.map((s) => <option key={s}>{s}</option>)}</select></td><td>{fmtData(x.dataInicio)}</td><td><select value={x.sinergia || ''} onChange={(e) => alterarRota(x.id, 'sinergia', e.target.value)}><option value="">—</option><option>COM SINERGIA</option><option>SEM SINERGIA</option></select></td><td>{x.tipoProjeto || '—'}</td></tr>)}</tbody></table></div></div>
  </>;
}

function InlineNumero({ value, onChange }) {
  return <input className="inline-number" type="number" min="0" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value || 0))}/>;
}

function NovaRota({ onClose }) {
  const [f, setF] = useState({ cidade: CIDADES[0], tecnico: '', auxiliar: '', endereco: '', hps: 0, blocos: 0, status: 'EM CONSTRUÇÃO', dataInicio: hojeISO(), sinergia: 'SEM SINERGIA', tipoProjeto: 'PROJETO F', maquinaFusao: false });
  const campo = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function salvar(e) { e.preventDefault(); await push(ref(db, 'rotaAtual'), { ...f, hps: Number(f.hps || 0), blocos: Number(f.blocos || 0), codigoImovel: codigoEndereco(f.endereco), criadoEm: ts() }); await auditar('ADICIONAR_ROTA', `${f.tecnico} · ${f.endereco}`); onClose(); }
  return <form className="quick-form" onSubmit={salvar}><div><label>Cidade</label><select value={f.cidade} onChange={campo('cidade')}>{CIDADES.map((c) => <option key={c}>{c}</option>)}</select></div><div><label>Técnico</label><input required value={f.tecnico} onChange={campo('tecnico')}/></div><div><label>Auxiliar</label><input value={f.auxiliar} onChange={campo('auxiliar')}/></div><div className="wide"><label>Endereço / código do imóvel</label><input required value={f.endereco} onChange={campo('endereco')}/></div><div><label>HPs</label><input type="number" value={f.hps} onChange={campo('hps')}/></div><div><label>Blocos</label><input type="number" value={f.blocos} onChange={campo('blocos')}/></div><div><label>Sinergia</label><select value={f.sinergia} onChange={campo('sinergia')}><option>COM SINERGIA</option><option>SEM SINERGIA</option></select></div><div><label>Tipo</label><select value={f.tipoProjeto} onChange={campo('tipoProjeto')}><option>PROJETO F</option><option>ONGOING</option><option>HFC</option></select></div><div className="form-actions"><button type="button" className="ghost" onClick={onClose}>Cancelar</button><button className="primary">Salvar equipe</button></div></form>;
}

function BaseGeral({ base }) {
  const [busca, setBusca] = useState('');
  const [cidade, setCidade] = useState('TODAS');
  const filtrada = useMemo(() => base.filter((x) => {
    const texto = [x.codigoImovel, x.endereco, x.nome, x.equipe, x.status].join(' ').toLowerCase();
    return (!busca || texto.includes(busca.toLowerCase())) && (cidade === 'TODAS' || normalizar(x.cidade) === normalizar(cidade));
  }), [base, busca, cidade]);
  function exportar() {
    const cols = ['cidade','equipe','tipoProjeto','sinergia','codigoImovel','endereco','nome','hps','construcao','mes','status','vistoria','medido','observacao'];
    const esc = (v) => `"${String(v ?? '').replaceAll('"','""')}"`;
    const csv = [cols.join(';'), ...filtrada.map((x) => cols.map((c) => esc(x[c])).join(';'))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `base-geral-${hojeISO()}.csv`; a.click();
  }
  const cidades = [...new Set(base.map((x) => x.cidade).filter(Boolean))].sort();
  return <><div className="toolbar"><div className="filters"><input className="search" placeholder="Buscar código, endereço, equipe..." value={busca} onChange={(e) => setBusca(e.target.value)}/><select value={cidade} onChange={(e) => setCidade(e.target.value)}><option>TODAS</option>{cidades.map((c) => <option key={c}>{c}</option>)}</select></div><button className="ghost" onClick={exportar}>Exportar CSV</button></div><div className="panel table-panel"><div className="table-meta"><b>{filtrada.length.toLocaleString('pt-BR')} registros</b><small>Mostrando até 400 linhas na tela. A busca consulta toda a base carregada.</small></div><div className="table-wrap"><table><thead><tr><th>Cidade</th><th>Código</th><th>Endereço / Nome</th><th>Equipe</th><th>HPs</th><th>Construção</th><th>Status</th><th>Projeto</th></tr></thead><tbody>{filtrada.slice(0,400).map((x) => <tr key={x.id}><td>{x.cidade || '—'}</td><td><b>{x.codigoImovel || '—'}</b></td><td className="address">{x.endereco || '—'}<small>{x.nome || ''}</small></td><td>{x.equipe || '—'}</td><td>{x.hps || 0}</td><td>{fmtData(x.construcao)}</td><td><span className="badge">{x.status || '—'}</span></td><td>{x.tipoProjeto || '—'}</td></tr>)}</tbody></table></div></div></>;
}

function Historico({ historico }) {
  const [busca, setBusca] = useState('');
  const lista = historico.filter((x) => [x.equipe,x.endereco,x.status,x.cidade].join(' ').toLowerCase().includes(busca.toLowerCase()));
  return <><div className="toolbar"><input className="search" placeholder="Filtrar histórico..." value={busca} onChange={(e) => setBusca(e.target.value)}/></div><div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Registrado em</th><th>Cidade</th><th>Equipe</th><th>Endereço</th><th>HPs</th><th>Blocos</th><th>Status</th><th>Início</th><th>Observação</th></tr></thead><tbody>{lista.slice(0,500).map((x) => <tr key={x.id}><td>{fmtData(x.dataHora)}</td><td>{x.cidade}</td><td><b>{x.equipe || '—'}</b></td><td className="address">{x.endereco || '—'}</td><td>{x.hps || 0}</td><td>{x.blocos || 0}</td><td><span className="badge warning">{x.status}</span></td><td>{fmtData(x.dataInicio)}</td><td>{x.observacao || '—'}</td></tr>)}</tbody></table></div></div></>;
}

function ProximasRotas({ proximas }) {
  const [f, setF] = useState({ cidade: CIDADES[0], endereco: '', status: 'PENDENTE', prioridade: 2, observacao: '', atribuido: '', ativo: true });
  async function adicionar(e) { e.preventDefault(); await push(ref(db, 'proximasRotas'), { ...f, prioridade: Number(f.prioridade), criadoEm: ts() }); setF({ ...f, endereco: '', observacao: '', atribuido: '' }); }
  async function enviar(x) { await push(ref(db, 'rotaAtual'), { cidade: x.cidade, tecnico: x.atribuido || '', auxiliar: '', endereco: x.endereco, hps: 0, blocos: 0, status: 'TENTANDO ACESSO', dataInicio: hojeISO(), sinergia: 'SEM SINERGIA', tipoProjeto: 'PROJETO F', maquinaFusao: false, criadoEm: ts() }); await update(ref(db, `proximasRotas/${x.id}`), { ativo: false, status: 'ENVIADO PARA ROTA', atualizadoEm: ts() }); }
  return <><form className="quick-form" onSubmit={adicionar}><div><label>Cidade</label><select value={f.cidade} onChange={(e) => setF({...f,cidade:e.target.value})}>{CIDADES.map((c)=><option key={c}>{c}</option>)}</select></div><div className="wide"><label>Endereço</label><input required value={f.endereco} onChange={(e)=>setF({...f,endereco:e.target.value})}/></div><div><label>Prioridade</label><select value={f.prioridade} onChange={(e)=>setF({...f,prioridade:e.target.value})}><option value="1">Alta</option><option value="2">Média</option><option value="3">Baixa</option></select></div><div><label>Atribuído</label><input value={f.atribuido} onChange={(e)=>setF({...f,atribuido:e.target.value})}/></div><div className="wide"><label>Observação</label><input value={f.observacao} onChange={(e)=>setF({...f,observacao:e.target.value})}/></div><div className="form-actions"><button className="primary">Adicionar à fila</button></div></form><div className="cards-list">{proximas.filter((x)=>x.ativo !== false).map((x)=><article className="route-card" key={x.id}><div className={`priority p${x.prioridade || 2}`}>{x.prioridade == 1 ? 'ALTA' : x.prioridade == 3 ? 'BAIXA' : 'MÉDIA'}</div><div><small>{x.cidade}</small><h3>{x.endereco}</h3><p>{x.observacao || 'Sem observação'} · {x.atribuido ? `Atribuído a ${x.atribuido}` : 'Não atribuído'}</p></div><div className="card-actions"><button className="primary" onClick={()=>enviar(x)}>Enviar para rota</button><button className="icon-btn" onClick={()=>remove(ref(db,`proximasRotas/${x.id}`))}>×</button></div></article>)}</div>{!proximas.filter((x)=>x.ativo !== false).length && <Empty texto="Nenhuma próxima rota cadastrada."/>}</>;
}

function Metas({ rota, base }) {
  const equipes = useMemo(() => {
    const mapa = {};
    for (const x of base) {
      if (!x.equipe) continue;
      const k = normalizar(x.equipe);
      mapa[k] ||= { equipe: x.equipe, construidos: 0, hps: 0 };
      if (isConstruido(x.status)) mapa[k].construidos++;
      mapa[k].hps += Number(x.hps || 0);
    }
    return Object.values(mapa).sort((a,b)=>b.hps-a.hps).slice(0,30);
  }, [base]);
  return <div className="grid-2"><div className="panel"><PanelTitle titulo="Ranking histórico por HPs" subtitulo="Base Geral"/><div className="ranking">{equipes.map((x,i)=><div key={x.equipe}><span>{i+1}</span><div><b>{x.equipe}</b><small>{x.construidos} registros construídos</small></div><strong>{x.hps.toLocaleString('pt-BR')} HPs</strong></div>)}</div></div><div className="panel"><PanelTitle titulo="Produção da rota atual" subtitulo="Equipes em campo"/><div className="ranking">{rota.filter((x)=>x.tecnico).sort((a,b)=>Number(b.hps||0)-Number(a.hps||0)).map((x,i)=><div key={x.id}><span>{i+1}</span><div><b>{x.tecnico}{x.auxiliar ? ` / ${x.auxiliar}` : ''}</b><small>{x.status} · {cidadeCurta(x.cidade)}</small></div><strong>{Number(x.hps||0)} HPs</strong></div>)}</div></div></div>;
}

function Configuracoes() {
  return <div className="settings-grid"><div className="panel"><PanelTitle titulo="Integração" subtitulo="Infraestrutura do sistema"/><div className="setting"><div><b>Firebase Realtime Database</b><small>Sincronização em tempo real entre usuários</small></div><span className="ok">ATIVO</span></div><div className="setting"><div><b>Firebase Hosting</b><small>Publicação web responsiva</small></div><span className="ok">ATIVO</span></div><div className="setting"><div><b>Planilha legada</b><small>Usada somente como fonte da migração inicial</small></div><span className="muted-badge">MIGRADA</span></div></div><div className="panel"><PanelTitle titulo="Regras automáticas" subtitulo="Fluxos substituindo a planilha"/><ul className="rules"><li>Ao marcar <b>CONSTRUÍDO</b>, o registro é consolidado na Base Geral.</li><li><b>ACESSO NEGADO</b> e <b>OBSTRUÇÃO</b> entram automaticamente no Histórico.</li><li>Próximas rotas podem ser enviadas diretamente para a rota diária.</li><li>Alterações da rota geram trilha de auditoria.</li></ul></div></div>;
}

function PanelTitle({ titulo, subtitulo }) { return <div className="panel-title"><div><h2>{titulo}</h2><p>{subtitulo}</p></div></div>; }
function Empty({ texto }) { return <div className="empty"><span>✓</span><p>{texto}</p></div>; }

export default App;
