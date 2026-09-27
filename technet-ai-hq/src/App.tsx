import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Bot, Building2, CheckCircle2, Clock3, Database, Gauge,
  MessageSquare, Play, Plus, ShieldCheck, Sparkles, Trash2, Users, XCircle
} from 'lucide-react';
import { api } from '@appdeploy/client';

type Step = {
  role: string;
  title: string;
  objective: string;
  status: 'queued' | 'done';
  result?: string;
};

type Mission = {
  id: string;
  request: string;
  department: string;
  summary: string;
  risk: 'automatic' | 'approval';
  status: 'ready' | 'awaiting_approval' | 'running' | 'completed' | 'failed';
  steps: Step[];
  createdAt: string;
  updatedAt: string;
};

type Agent = {
  role: string;
  name: string;
  department: string;
  icon: string;
  x: number;
  y: number;
  seatX: number;
  seatY: number;
};

const agents: Agent[] = [
  { role: 'DIRETOR', name: 'Diretor IA', department: 'Diretoria', icon: '🧠', x: 49, y: 17, seatX: 49, seatY: 17 },
  { role: 'MDU', name: 'Gestor MDU', department: 'MDU', icon: '🏢', x: 19, y: 36, seatX: 19, seatY: 36 },
  { role: 'COMERCIAL', name: 'Gestor Comercial', department: 'Comercial', icon: '💼', x: 34, y: 36, seatX: 34, seatY: 36 },
  { role: 'TECNICA', name: 'Gestor Técnica', department: 'Operações', icon: '📡', x: 65, y: 36, seatX: 65, seatY: 36 },
  { role: 'FINANCEIRO', name: 'Gestor Financeiro', department: 'Financeiro', icon: '💰', x: 81, y: 36, seatX: 81, seatY: 36 },
  { role: 'RH', name: 'Gestor RH', department: 'Pessoas', icon: '👥', x: 18, y: 69, seatX: 18, seatY: 69 },
  { role: 'ANALISTA', name: 'Analista IA', department: 'Dados', icon: '📊', x: 36, y: 69, seatX: 36, seatY: 69 },
  { role: 'DEV', name: 'Developer IA', department: 'Tecnologia', icon: '💻', x: 61, y: 69, seatX: 61, seatY: 69 },
  { role: 'QA', name: 'QA IA', department: 'Qualidade', icon: '🧪', x: 74, y: 69, seatX: 74, seatY: 69 },
  { role: 'DEVOPS', name: 'DevOps IA', department: 'Infraestrutura', icon: '🚀', x: 87, y: 69, seatX: 87, seatY: 69 },
];

const examplePrompts = [
  'Analise por que o cálculo de KM do técnico está divergente e proponha a correção.',
  'Monte um plano para melhorar o acompanhamento de obras MDU desta semana.',
  'Analise os principais riscos do funil comercial e indique ações prioritárias.',
];

const roleLabel = (role: string) => agents.find(agent => agent.role === role)?.name ?? role;

function App() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [request, setRequest] = useState('');
  const [creating, setCreating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runningRole, setRunningRole] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<'office' | 'missions'>('office');
  const [selectedRole, setSelectedRole] = useState<string>('DIRETOR');
  const [playerPos, setPlayerPos] = useState({ x: 49, y: 48 });

  const activeMission = useMemo(
    () => missions.find(mission => mission.id === activeId) ?? missions[0] ?? null,
    [missions, activeId]
  );

  const busyRole =
    runningRole ??
    activeMission?.steps.find(step => step.status !== 'done')?.role ??
    null;

  const loadMissions = async () => {
    try {
      const response = await api.get('/api/missions');
      const data = response.data as { missions: Mission[] };
      setMissions(data.missions);
      if (!activeId && data.missions.length > 0) setActiveId(data.missions[0].id);
    } catch {
      setMessage('Não foi possível carregar as missões.');
    }
  };

  useEffect(() => {
    void loadMissions();
  }, []);

  const replaceMission = (mission: Mission) => {
    setMissions(current => {
      const exists = current.some(item => item.id === mission.id);
      const next = exists
        ? current.map(item => item.id === mission.id ? mission : item)
        : [mission, ...current];
      return [...next].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
    setActiveId(mission.id);
  };

  const createMission = async () => {
    const clean = request.trim();
    if (!clean) {
      setMessage('Digite um pedido para o Diretor IA.');
      return;
    }
    setCreating(true);
    setMessage(null);
    try {
      const response = await api.post('/api/missions', { request: clean });
      const mission = response.data as Mission;
      replaceMission(mission);
      setRequest('');
      setMessage(
        mission.status === 'awaiting_approval'
          ? 'Plano criado. Esta missão precisa da sua aprovação antes de executar.'
          : 'Plano criado. A equipe está pronta para executar.'
      );
    } catch {
      setMessage('A IA não conseguiu planejar esta missão. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const approveMission = async (mission: Mission) => {
    try {
      const response = await api.post(`/api/missions/${mission.id}/approve`, {});
      replaceMission(response.data as Mission);
      setMessage('Missão aprovada e liberada para execução.');
    } catch {
      setMessage('Não foi possível aprovar a missão.');
    }
  };

  const runMission = async (mission: Mission) => {
    if (mission.status === 'awaiting_approval') {
      setMessage('Aprove a missão antes de executar.');
      return;
    }
    if (mission.status === 'completed') return;
    setRunningId(mission.id);
    setMessage(null);
    let current = mission;
    try {
      while (current.status !== 'completed') {
        const next = current.steps.find(step => step.status !== 'done');
        if (!next) break;
        setRunningRole(next.role);
        const response = await api.post(`/api/missions/${current.id}/step`, {});
        current = response.data as Mission;
        replaceMission(current);
      }
      setMessage('Missão concluída. O relatório completo está na linha do tempo.');
    } catch {
      setMessage('A execução foi interrompida. Você pode continuar de onde parou.');
    } finally {
      setRunningRole(null);
      setRunningId(null);
    }
  };

  const deleteMission = async (mission: Mission) => {
    if (!window.confirm('Excluir esta missão e o histórico dela?')) return;
    try {
      await api.delete(`/api/missions/${mission.id}`);
      setMissions(current => current.filter(item => item.id !== mission.id));
      setActiveId(null);
      setMessage('Missão excluída.');
    } catch {
      setMessage('Não foi possível excluir a missão.');
    }
  };

  const activeCount = missions.filter(mission =>
    mission.status === 'running' || mission.status === 'ready'
  ).length;
  const completedCount = missions.filter(mission => mission.status === 'completed').length;

  const movePlayer = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPlayerPos({
      x: Math.max(4, Math.min(96, x)),
      y: Math.max(8, Math.min(92, y)),
    });
  };

  const selectedAgent = agents.find(agent => agent.role === selectedRole) ?? agents[0];

  return (
    <div className='shell'>
      <aside className='sidebar'>
        <div className='brand'>
          <div className='brand-mark'>T</div>
          <div><strong>TECHNET AI HQ</strong><span>Virtual Office</span></div>
        </div>
        <nav>
          <button className={tab === 'office' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('office')}>
            <Building2 size={18} /> Escritório
          </button>
          <button className={tab === 'missions' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('missions')}>
            <Activity size={18} /> Missões
          </button>
        </nav>
        <div className='sidebar-card'>
          <div className='eyebrow'>ESPAÇO VIVO</div>
          <div className='online'><span /> {agents.length} agentes conectados</div>
          <p>Clique no mapa para mover seu avatar. Clique em qualquer agente para abrir o perfil operacional.</p>
        </div>
        <div className='sidebar-footer'>
          <ShieldCheck size={16} />
          <span>Ações críticas exigem aprovação</span>
        </div>
      </aside>

      <main>
        <header className='topbar'>
          <div>
            <div className='eyebrow'>TECHNET · CENTRAL DE IA</div>
            <h1>{tab === 'office' ? 'Escritório Virtual' : 'Central de Missões'}</h1>
          </div>
          <div className='top-status'><span className='pulse' /> Online agora</div>
        </header>

        <section className='stats'>
          <div className='stat'><Bot /><div><strong>{agents.length}</strong><span>agentes online</span></div></div>
          <div className='stat'><Play /><div><strong>{activeCount}</strong><span>missões ativas</span></div></div>
          <div className='stat'><CheckCircle2 /><div><strong>{completedCount}</strong><span>concluídas</span></div></div>
          <div className='stat'><Gauge /><div><strong>{runningId ? 'OCUPADO' : 'LIVRE'}</strong><span>orquestrador</span></div></div>
        </section>

        {message && (
          <div className='notice'>
            {message}
            <button onClick={() => setMessage(null)}><XCircle size={16} /></button>
          </div>
        )}

        {tab === 'office' ? (
          <section className='office-layout'>
            <div className='map-card'>
              <div className='map-toolbar'>
                <div>
                  <span className='eyebrow'>ANDAR PRINCIPAL</span>
                  <h2>TECHNET Virtual HQ</h2>
                </div>
                <div className='map-hint'>Clique para caminhar</div>
              </div>

              <div className='virtual-office' onClick={movePlayer} data-testid='virtual-office'>
                <div className='room room-board'><span>SALA DE DIRETORIA</span></div>
                <div className='room room-mdu'><span>MDU + COMERCIAL</span></div>
                <div className='room room-ops'><span>OPERAÇÕES + FINANCEIRO</span></div>
                <div className='room room-people'><span>PESSOAS + DADOS</span></div>
                <div className='room room-tech'><span>TECNOLOGIA + QA + DEVOPS</span></div>

                <div className='meeting-table table-top' />
                <div className='meeting-table table-left' />
                <div className='sofa sofa-a' />
                <div className='sofa sofa-b' />
                <div className='plant plant-a'>🌿</div>
                <div className='plant plant-b'>🌿</div>
                <div className='coffee'>☕</div>
                <div className='server-rack'>▦</div>

                {agents.map(agent => {
                  const isBusy = runningId !== null && busyRole === agent.role;
                  const isSelected = selectedRole === agent.role;
                  return (
                    <button
                      key={agent.role}
                      type='button'
                      className={`avatar agent-avatar ${isBusy ? 'working' : ''} ${isSelected ? 'selected' : ''}`}
                      style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
                      onClick={event => {
                        event.stopPropagation();
                        setSelectedRole(agent.role);
                      }}
                      aria-label={`Abrir agente ${agent.name}`}
                    >
                      <span className='avatar-status'>{isBusy ? 'TRABALHANDO' : 'LIVRE'}</span>
                      <span className='avatar-head'>{agent.icon}</span>
                      <span className='avatar-body' />
                      <span className='avatar-name'>{agent.name}</span>
                    </button>
                  );
                })}

                <div className='avatar player-avatar' style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }} data-testid='player-avatar'>
                  <span className='avatar-status you'>VOCÊ</span>
                  <span className='avatar-head'>🧑‍💼</span>
                  <span className='avatar-body player' />
                  <span className='avatar-name'>Clayverton</span>
                </div>
              </div>

              <div className='command-box'>
                <div className='command-title'><Sparkles size={18} /><strong>Fale com o Diretor IA</strong></div>
                <textarea
                  value={request}
                  onChange={event => setRequest(event.target.value)}
                  placeholder='Ex.: verifique meu sistema MDU, identifique o problema e organize a equipe para resolver...'
                />
                <div className='command-actions'>
                  <div className='chips'>
                    {examplePrompts.map(prompt => (
                      <button key={prompt} onClick={() => setRequest(prompt)}>
                        {prompt.split(' ').slice(0, 5).join(' ')}...
                      </button>
                    ))}
                  </div>
                  <button className='primary' onClick={() => void createMission()} disabled={creating}>
                    {creating ? 'Planejando...' : <><Plus size={17} /> Criar missão</>}
                  </button>
                </div>
              </div>
            </div>

            <aside className='right-column'>
              <section className='agent-panel'>
                <div className='agent-profile'>
                  <div className='agent-big'>{selectedAgent.icon}</div>
                  <div>
                    <span className='eyebrow'>AGENTE SELECIONADO</span>
                    <h2>{selectedAgent.name}</h2>
                    <p>{selectedAgent.department}</p>
                  </div>
                </div>
                <div className='agent-state'>
                  <span className={busyRole === selectedAgent.role ? 'state-dot busy' : 'state-dot'} />
                  {busyRole === selectedAgent.role ? 'Executando uma tarefa agora' : 'Disponível para receber trabalho'}
                </div>
                <div className='agent-actions'>
                  <button onClick={() => setRequest(`Peça ao ${selectedAgent.name} para `)}><MessageSquare size={15} /> Dar tarefa</button>
                  <button onClick={() => setPlayerPos({ x: selectedAgent.x - 4, y: selectedAgent.y + 5 })}><Users size={15} /> Ir até ele</button>
                </div>
              </section>

              <MissionDetail
                mission={activeMission}
                runningId={runningId}
                onApprove={approveMission}
                onRun={runMission}
                onDelete={deleteMission}
              />
            </aside>
          </section>
        ) : (
          <section className='missions-view'>
            <div className='mission-list-panel'>
              <div className='panel-title'>
                <div><span className='eyebrow'>HISTÓRICO</span><h2>Todas as missões</h2></div>
              </div>
              {missions.length === 0 ? (
                <div className='empty'><Database size={38} /><strong>Nenhuma missão criada</strong><span>Volte ao Escritório e envie o primeiro pedido.</span></div>
              ) : (
                <div className='mission-list'>
                  {missions.map(mission => (
                    <button className={mission.id === activeMission?.id ? 'mission-row selected' : 'mission-row'} key={mission.id} onClick={() => setActiveId(mission.id)}>
                      <div className='mission-row-main'><strong>{mission.summary}</strong><span>{mission.department} · {mission.steps.length} etapas</span></div>
                      <span>{mission.status === 'completed' ? 'Concluída' : mission.status === 'awaiting_approval' ? 'Aprovação' : 'Ativa'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <MissionDetail
              mission={activeMission}
              runningId={runningId}
              onApprove={approveMission}
              onRun={runMission}
              onDelete={deleteMission}
            />
          </section>
        )}
      </main>
    </div>
  );
}

function MissionDetail({
  mission, runningId, onApprove, onRun, onDelete,
}: {
  mission: Mission | null;
  runningId: string | null;
  onApprove: (mission: Mission) => Promise<void>;
  onRun: (mission: Mission) => Promise<void>;
  onDelete: (mission: Mission) => Promise<void>;
}) {
  if (!mission) {
    return (
      <section className='detail-panel empty-detail'>
        <Bot size={38} />
        <h3>Nenhuma missão ativa</h3>
        <p>Envie um pedido ao Diretor IA para reunir automaticamente a equipe certa.</p>
      </section>
    );
  }

  const done = mission.steps.filter(step => step.status === 'done').length;
  const progress = mission.steps.length ? Math.round((done / mission.steps.length) * 100) : 0;
  const isRunning = runningId === mission.id;

  return (
    <section className='detail-panel'>
      <div className='detail-head'>
        <div><span className='eyebrow'>MISSÃO ATUAL</span><h2>{mission.summary}</h2></div>
        <button className='icon-button danger' onClick={() => void onDelete(mission)} title='Excluir missão'><Trash2 size={17} /></button>
      </div>
      <div className='mission-meta'>
        <span><Building2 size={14} /> {mission.department}</span>
        <span><Users size={14} /> {mission.steps.length} etapas</span>
        <span><Clock3 size={14} /> {new Date(mission.createdAt).toLocaleString('pt-BR')}</span>
      </div>
      <p className='request-quote'>“{mission.request}”</p>
      <div className='progress-wrap'>
        <div><span>Progresso</span><strong>{progress}%</strong></div>
        <div className='progress'><span style={{ width: `${progress}%` }} /></div>
      </div>
      <div className='timeline'>
        {mission.steps.map((step, index) => (
          <div className={step.status === 'done' ? 'timeline-item done' : 'timeline-item'} key={`${step.role}-${index}`}>
            <div className='timeline-dot'>{step.status === 'done' ? '✓' : index + 1}</div>
            <div>
              <div className='timeline-top'><strong>{roleLabel(step.role)}</strong><span>{step.title}</span></div>
              <p>{step.objective}</p>
              {step.result && <div className='result-box'>{step.result}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className='detail-actions'>
        {mission.status === 'awaiting_approval' ? (
          <button className='primary full' onClick={() => void onApprove(mission)}><ShieldCheck size={17} /> Aprovar execução</button>
        ) : mission.status !== 'completed' ? (
          <button className='primary full' onClick={() => void onRun(mission)} disabled={isRunning}>
            {isRunning ? 'Equipe trabalhando...' : <><Play size={17} /> Executar missão</>}
          </button>
        ) : (
          <div className='complete-banner'><CheckCircle2 size={18} /> Missão concluída</div>
        )}
      </div>
    </section>
  );
}

export default App;