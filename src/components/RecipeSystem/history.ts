export type HistorySnapshot<TNode, TEdge> = {
    nodes: TNode[];
    edges: TEdge[];
};

const cloneState = <TNode, TEdge>(nodes: TNode[], edges: TEdge[]): HistorySnapshot<TNode, TEdge> => ({
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges))
});

export const createHistorySnapshot = cloneState;

export const appendHistorySnapshot = <TNode, TEdge>(
    past: HistorySnapshot<TNode, TEdge>[],
    nodes: TNode[],
    edges: TEdge[],
    limit = 50
) => [...past, cloneState(nodes, edges)].slice(-limit);
