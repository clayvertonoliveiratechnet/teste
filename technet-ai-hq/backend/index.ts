import { ai, db, error, json, router } from '@appdeploy/sdk';

type MissionStatus =
  | 'ready'
  | 'awaiting_approval'
  | 'running'
  | 'completed'
  | 'failed';
type Risk = 'automatic' | 'approval';

type Step = {
  role: string;
  title: string;
  objective: string;
  status: 'queued' | 'done';
  result?: string;
};

type MissionRecord = {
  request: string;
  department: string;
  summary: string;
  risk: Risk;
  status: MissionStatus;
  steps: Step[];
  createdAt: string;
  updatedAt: string;
};

type Plan = {
  department: string;
  summary: string;
  risk: Risk;
  steps: Array<{ role: string; title: string; objective: string }>;
};

const planSchema = {
  type: 'object',
  properties: {
    department: { type: 'string' },
    summary: { type: 'string' },
    risk: { type: 'string', enum: ['automatic', 'approval'] },
    steps: {
      type: 'array',
      minItems: 3,
      maxItems: 4,
      items: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: [
              'DIRETOR',
              'MDU',
              'COMERCIAL',
              'TECNICA',
              'FINANCEIRO',
              'RH',
              'ANALISTA',
              'DEV',
              'QA',
              'DEVOPS',
            ],
          },
          title: { type: 'string' },
          objective: { type: 'string' },
        },
        required: ['role', 'title', 'objective'],
      },
    },
  },
  required: ['department', 'summary', 'risk', 'steps'],
};

function parsePlan(text: string): Plan {
  const normalized = text
    .replace(/^\`\`\`json\s*/i, '')
    .replace(/\`\`\`\s*$/i, '')
    .trim();
  const parsed = JSON.parse(normalized) as Plan;
  const safeSteps = parsed.steps.slice(0, 4).map(step => ({
    role: step.role,
    title: step.title.slice(0, 80),
    objective: step.objective.slice(0, 240),
  }));
  return {
    department: parsed.department.slice(0, 80),
    summary: parsed.summary.slice(0, 140),
    risk: parsed.risk === 'approval' ? 'approval' : 'automatic',
    steps:
      safeSteps.length >= 3
        ? safeSteps
        : [
            {
              role: 'DIRETOR',
              title: 'Entender a solicitação',
              objective: 'Definir escopo, objetivo e critérios de conclusão.',
            },
            {
              role: 'ANALISTA',
              title: 'Analisar o cenário',
              objective: 'Levantar evidências e construir uma linha de ação.',
            },
            {
              role: 'QA',
              title: 'Validar a entrega',
              objective: 'Revisar o resultado e registrar os próximos passos.',
            },
          ],
  };
}

function withId(record: MissionRecord, id: string) {
  return { ...record, id };
}

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],

  'GET /api/missions': [
    async () => {
      const { items } = await db.list<MissionRecord>('missions', { limit: 50 });
      const missions = items
        .map(item => ({ ...item }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return json({ missions });
    },
  ],

  'POST /api/missions': [
    async ({ body }) => {
      const payload = body as { request?: string };
      const request = payload.request?.trim();
      if (!request) return error('Pedido é obrigatório.', 400);

      const planned = await ai.generate({
        system:
          'Você é o Diretor IA de uma empresa brasileira de telecom. Transforme pedidos em um plano operacional curto. Escolha somente os papéis necessários. Use DIRETOR para coordenação, MDU para obras/condomínios, COMERCIAL para vendas, TECNICA para campo/rastreio/produtividade, FINANCEIRO para custos, RH para pessoas, ANALISTA para dados, DEV para software, QA para testes e DEVOPS para deploy/infra. Use risk=approval quando o pedido implicar ação crítica, alteração de produção, exclusão de dados, envio externo ou impacto financeiro. Caso contrário use automatic. Responda em português.',
        prompt: request,
        schema: planSchema,
        maxTokens: 1100,
        temperature: 0.2,
        thinkingMode: 'FAST',
      });

      let plan: Plan;
      try {
        plan = parsePlan(planned.text);
      } catch {
        plan = {
          department: 'Diretoria',
          summary: request.slice(0, 120),
          risk: 'automatic',
          steps: [
            {
              role: 'DIRETOR',
              title: 'Interpretar pedido',
              objective:
                'Definir o resultado esperado e distribuir as responsabilidades.',
            },
            {
              role: 'ANALISTA',
              title: 'Analisar informações',
              objective:
                'Organizar o contexto e produzir evidências para a decisão.',
            },
            {
              role: 'QA',
              title: 'Revisar resultado',
              objective: 'Validar consistência, riscos e próximos passos.',
            },
          ],
        };
      }

      const now = new Date().toISOString();
      const record: MissionRecord = {
        request,
        department: plan.department,
        summary: plan.summary,
        risk: plan.risk,
        status: plan.risk === 'approval' ? 'awaiting_approval' : 'ready',
        steps: plan.steps.map(step => ({ ...step, status: 'queued' })),
        createdAt: now,
        updatedAt: now,
      };
      const [id] = await db.add('missions', [record]);
      if (!id) return error('Falha ao salvar missão.', 500);
      return json(withId(record, id), 201);
    },
  ],

  'POST /api/missions/:id/approve': [
    async ({ params }) => {
      const [mission] = await db.get<MissionRecord>('missions', [params.id]);
      if (!mission) return error('Missão não encontrada.', 404);
      const updated: MissionRecord = {
        ...mission,
        status: mission.status === 'completed' ? 'completed' : 'ready',
        updatedAt: new Date().toISOString(),
      };
      const [ok] = await db.update('missions', [
        { id: params.id, record: updated },
      ]);
      if (!ok) return error('Falha ao aprovar missão.', 500);
      return json(withId(updated, params.id));
    },
  ],

  'POST /api/missions/:id/step': [
    async ({ params }) => {
      const [mission] = await db.get<MissionRecord>('missions', [params.id]);
      if (!mission) return error('Missão não encontrada.', 404);
      if (mission.status === 'awaiting_approval')
        return error('Missão requer aprovação.', 409);
      if (mission.status === 'completed')
        return json(withId(mission, params.id));

      const stepIndex = mission.steps.findIndex(step => step.status !== 'done');
      if (stepIndex < 0) {
        const completed: MissionRecord = {
          ...mission,
          status: 'completed',
          updatedAt: new Date().toISOString(),
        };
        await db.update('missions', [{ id: params.id, record: completed }]);
        return json(withId(completed, params.id));
      }

      const step = mission.steps[stepIndex];
      const previous = mission.steps
        .filter(item => item.status === 'done' && item.result)
        .map(item => `${item.role}: ${item.result}`)
        .join('\n');

      const execution = await ai.generate({
        system: `Você está atuando como ${step.role} em uma empresa de telecom. Execute somente sua etapa. Seja objetivo, profissional e útil. Entregue entre 3 e 8 linhas em português, com achados, decisão ou próximo passo concreto. Não diga que executou ações externas que você não pode comprovar.`,
        prompt: `Pedido original: ${mission.request}\nObjetivo da missão: ${mission.summary}\nSua etapa: ${step.title}\nObjetivo da etapa: ${step.objective}\nResultados anteriores:\n${previous || 'Nenhum ainda.'}`,
        maxTokens: 700,
        temperature: 0.25,
        thinkingMode: 'FAST',
      });

      const steps = mission.steps.map((item, index) =>
        index === stepIndex
          ? {
              ...item,
              status: 'done' as const,
              result: execution.text.trim().slice(0, 3500),
            }
          : item
      );
      const finished = steps.every(item => item.status === 'done');
      const updated: MissionRecord = {
        ...mission,
        steps,
        status: finished ? 'completed' : 'running',
        updatedAt: new Date().toISOString(),
      };
      const [ok] = await db.update('missions', [
        { id: params.id, record: updated },
      ]);
      if (!ok) return error('Falha ao atualizar missão.', 500);
      return json(withId(updated, params.id));
    },
  ],

  'DELETE /api/missions/:id': [
    async ({ params }) => {
      const [deleted] = await db.delete('missions', [params.id]);
      if (!deleted) return error('Missão não encontrada.', 404);
      return json({ deleted: true });
    },
  ],
});
