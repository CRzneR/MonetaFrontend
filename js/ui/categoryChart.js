"use strict";

export class CostsStore {
  constructor(initialCosts = []) {
    this.costs = Array.isArray(initialCosts) ? initialCosts : [];
    this.subscribers = new Set();
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    // sofort initial pushen
    fn(this.costs);
    return () => this.subscribers.delete(fn);
  }

  notify() {
    for (const fn of this.subscribers) fn(this.costs);
  }

  set(costs) {
    this.costs = Array.isArray(costs) ? costs : [];
    this.notify();
  }

  add(cost) {
    if (!cost?._id) return;
    // vorne einfügen (wie deine Sortierung createdAt desc)
    this.costs = [cost, ...this.costs];
    this.notify();
  }

  remove(id) {
    if (!id) return;
    this.costs = this.costs.filter((c) => c._id !== id);
    this.notify();
  }

  // Optional: falls du später edit brauchst
  update(id, patch) {
    this.costs = this.costs.map((c) => (c._id === id ? { ...c, ...patch } : c));
    this.notify();
  }
}

export class CategoryChart {
  constructor({ canvasId, type = "doughnut", title = null } = {}) {
    this.canvasId = canvasId;
    this.type = type;
    this.title = title;
    this.chart = null;
  }

  mount() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      console.warn(`[CategoryChart] Canvas #${this.canvasId} nicht gefunden.`);
      return;
    }
    this.ctx = canvas.getContext("2d");
  }

  // Reine Berechnung: Kosten -> {labels,data}
  compute(costs) {
    const totals = new Map();

    for (const c of costs) {
      const cat = (c.kategorie || "Ohne Kategorie").trim();
      const value = Number(c.kosten) || 0;
      totals.set(cat, (totals.get(cat) || 0) + value);
    }

    // Optional: sortieren (höchste zuerst)
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);

    return {
      labels: sorted.map(([k]) => k),
      data: sorted.map(([, v]) => Number(v.toFixed(2))),
    };
  }

  render(costs) {
    if (!this.ctx) this.mount();
    if (!this.ctx) return;

    const { labels, data } = this.compute(costs);

    if (!this.chart) {
      this.chart = new Chart(this.ctx, {
        type: this.type, // "doughnut" oder "bar"
        data: {
          labels,
          datasets: [{ data }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            title: this.title ? { display: true, text: this.title } : { display: false },
            tooltip: {
              callbacks: {
                label: (item) => `${item.label}: ${item.formattedValue} €`,
              },
            },
          },
        },
      });
      return;
    }

    // Update bestehender Chart
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  }

  bindToStore(store) {
    return store.subscribe((costs) => this.render(costs));
  }

  destroy() {
    this.chart?.destroy();
    this.chart = null;
  }
}
