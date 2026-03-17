from __future__ import annotations

import heapq
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional


@dataclass
class Node:
    id: str


@dataclass
class Edge:
    u: str
    v: str
    weight: float  # e.g., pipe loss or distance


class Graph:
    def __init__(self):
        self.adj: Dict[str, List[Tuple[str, float]]] = {}

    def add_edge(self, u: str, v: str, weight: float):
        self.adj.setdefault(u, []).append((v, weight))
        self.adj.setdefault(v, []).append((u, weight))

    def shortest_path(self, src: str, dst: str) -> Tuple[float, List[str]]:
        # Dijkstra
        pq: List[Tuple[float, str, Optional[str]]] = [(0.0, src, None)]
        dist: Dict[str, float] = {src: 0.0}
        prev: Dict[str, Optional[str]] = {src: None}
        visited = set()

        while pq:
            d, u, _ = heapq.heappop(pq)
            if u in visited:
                continue
            visited.add(u)
            if u == dst:
                break
            for v, w in self.adj.get(u, []):
                nd = d + w
                if v not in dist or nd < dist[v]:
                    dist[v] = nd
                    prev[v] = u
                    heapq.heappush(pq, (nd, v, u))

        if dst not in dist:
            return float("inf"), []
        # reconstruct
        path: List[str] = []
        cur: Optional[str] = dst
        while cur is not None:
            path.append(cur)
            cur = prev[cur]
        path.reverse()
        return dist[dst], path