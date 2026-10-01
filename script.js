(function () {
  "use strict";

  // ========== CONFIGURAÇÃO ==========
  const STORAGE_KEY = "labui-cronograma-checks";
  const EVENT_START = 12 * 60; // 12:00 (em minutos)
  const EVENT_END = 19 * 60;   // 19:00 (em minutos)

  // ========== ELEMENTOS ==========
  const timeline = document.getElementById("timeline");
  const progressLabel = document.getElementById("progressLabel");
  const progressPercent = document.getElementById("progressPercent");
  const progressBar = document.getElementById("progressBar");
  const progressTrack = document.getElementById("progressTrack");
  const expandAllBtn = document.getElementById("expandAllBtn");
  const collapseAllBtn = document.getElementById("collapseAllBtn");
  const resetBtn = document.getElementById("resetBtn");

  const allSteps = () => Array.from(timeline.querySelectorAll(".step"));
  const checkableSteps = () => allSteps().filter((step) => step.querySelector(".step__check input"));

  // ========== ESTADO ==========
  let checks = loadChecks();

  // ========== INICIALIZAÇÃO ==========
  function init() {
    restoreChecks();
    updateProgress();
    markCurrentStep();
    bindEvents();
  }

  // ========== PERSISTÊNCIA ==========
  function loadChecks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveChecks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    } catch (e) {
      /* silencioso */
    }
  }

  function restoreChecks() {
    allSteps().forEach((step) => {
      const id = step.dataset.id;
      const input = step.querySelector(".step__check input");
      if (input && checks[id]) {
        input.checked = true;
        step.classList.add("is-done");
      }
    });
  }

  // ========== PROGRESSO ==========
  function updateProgress() {
    const steps = checkableSteps();
    const total = steps.length;
    const done = steps.filter((step) => step.querySelector(".step__check input").checked).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    progressLabel.textContent = `${done} de ${total} etapas concluídas`;
    progressPercent.textContent = `${percent}%`;
    progressBar.style.width = `${percent}%`;
    progressTrack.setAttribute("aria-valuenow", String(percent));
  }

  // ========== ETAPA ATUAL ==========
  function markCurrentStep() {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Só marca se estiver dentro da janela do evento
    if (nowMinutes < EVENT_START || nowMinutes > EVENT_END) {
      return;
    }

    // Limpa marcações anteriores
    allSteps().forEach((step) => {
      step.classList.remove("is-current");
      const badge = step.querySelector(".step__badge");
      if (badge) badge.hidden = true;
    });

    // Encontra a etapa atual (última cujo horário <= agora)
    let current = null;
    let next = null;

    allSteps().forEach((step) => {
      const time = step.dataset.time;
      if (!time) return;
      const [h, m] = time.split(":").map(Number);
      const stepMinutes = h * 60 + m;

      if (stepMinutes <= nowMinutes) {
        current = step;
      } else if (!next) {
        next = step;
      }
    });

    if (current) {
      current.classList.add("is-current");
      const badge = current.querySelector(".step__badge");
      if (badge) {
        badge.textContent = "Agora";
        badge.hidden = false;
      }
    }

    if (next) {
      const badge = next.querySelector(".step__badge");
      if (badge) {
        badge.textContent = "Próxima";
        badge.hidden = false;
      }
    }
  }

  // ========== EVENTOS ==========
  function bindEvents() {
    // Delegação de eventos para os toggles
    timeline.addEventListener("click", (e) => {
      const toggle = e.target.closest(".step__toggle");
      if (!toggle || toggle.classList.contains("step__toggle--static")) return;

      const expanded = toggle.getAttribute("aria-expanded") === "true";
      const panel = document.getElementById(toggle.getAttribute("aria-controls"));

      toggle.setAttribute("aria-expanded", String(!expanded));
      panel.setAttribute("aria-hidden", String(expanded));
    });

    // Checkboxes
    timeline.addEventListener("change", (e) => {
      const input = e.target;
      if (!input.matches(".step__check input")) return;

      const step = input.closest(".step");
      const id = step.dataset.id;

      if (input.checked) {
        step.classList.add("is-done");
        checks[id] = true;
      } else {
        step.classList.remove("is-done");
        delete checks[id];
      }

      saveChecks();
      updateProgress();
    });

    // Botão expandir tudo
    expandAllBtn.addEventListener("click", () => {
      allSteps().forEach((step) => {
        const toggle = step.querySelector(".step__toggle");
        if (!toggle || toggle.classList.contains("step__toggle--static")) return;
        const panel = document.getElementById(toggle.getAttribute("aria-controls"));
        toggle.setAttribute("aria-expanded", "true");
        panel.setAttribute("aria-hidden", "false");
      });
    });

    // Botão recolher tudo
    collapseAllBtn.addEventListener("click", () => {
      allSteps().forEach((step) => {
        const toggle = step.querySelector(".step__toggle");
        if (!toggle || toggle.classList.contains("step__toggle--static")) return;
        const panel = document.getElementById(toggle.getAttribute("aria-controls"));
        toggle.setAttribute("aria-expanded", "false");
        panel.setAttribute("aria-hidden", "true");
      });
    });

    // Botão reiniciar
    resetBtn.addEventListener("click", () => {
      const confirmReset = window.confirm("Tem certeza que deseja desmarcar todas as etapas?");
      if (!confirmReset) return;

      checks = {};
      saveChecks();

      allSteps().forEach((step) => {
        const input = step.querySelector(".step__check input");
        if (input) {
          input.checked = false;
          step.classList.remove("is-done");
        }
      });

      updateProgress();
    });

    // Atualiza etapa atual a cada minuto
    setInterval(markCurrentStep, 60 * 1000);
  }

  // ========== START ==========
  document.addEventListener("DOMContentLoaded", init);
})();