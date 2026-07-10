// URL del servidor Flask
const API_URL = "http://127.0.0.1:5000";

// Historial local para la gráfica
let recompensaAcumulada = 0;
let historialRecompensas = [0];
let contadorPasos = [0];
let pasoActual = 0;
// Métricas de rendimiento
let totalDecisiones = 0;
let aciertos = 0;
let falsosPositivos = 0;
let falsosNegativos = 0;

function obtenerEstadoAleatorio() {
    const opcionesMonto = ['Bajo', 'Medio', 'Alto'];
    const opcionesUbicacion = ['Local', 'Internacional_Habitual', 'Internacional_Sospechosa'];
    const opcionesDispositivo = ['Frecuente', 'Nuevo'];
    const opcionesHora = ['Regular', 'Madrugada'];
    const opcionesFrecuencia = ['Normal', 'Alta_Frecuencia'];

    return {
        monto: opcionesMonto[Math.floor(Math.random() * opcionesMonto.length)],
        ubicacion: opcionesUbicacion[Math.floor(Math.random() * opcionesUbicacion.length)],
        dispositivo: opcionesDispositivo[Math.floor(Math.random() * opcionesDispositivo.length)],
        hora: opcionesHora[Math.floor(Math.random() * opcionesHora.length)],
        frecuencia: opcionesFrecuencia[Math.floor(Math.random() * opcionesFrecuencia.length)]
    };
}

function calcularRecompensa(accionAgente, esFraudeReal) {
    if (esFraudeReal) {
        return accionAgente === 'Bloquear' ? 5 : -8;
    }
    return accionAgente === 'Aprobar' ? 3 : -6;
}

// Inicializar la gráfica de Chart.js
const ctx = document.getElementById('chart-aprendizaje').getContext('2d');
const chartAprendizaje = new Chart(ctx, {
    type: 'line',
    data: {
        labels: contadorPasos,
        datasets: [{
            label: 'Recompensa Total',
            data: historialRecompensas,
            borderColor: '#fbbf24',
            backgroundColor: 'rgba(251, 191, 36, 0.16)',
            borderWidth: 3,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#ffffff',
            pointRadius: 3,
            tension: 0.3,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { grid: { color: '#e2e8f0' }, ticks: { color: '#334155' }, border: { color: '#cbd5e1' } },
            x: { grid: { color: '#e2e8f0' }, ticks: { color: '#334155' }, border: { color: '#cbd5e1' } }
        },
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#111827', titleColor: '#fef3c7', bodyColor: '#fef3c7' }
        }
    }
});

function resetAprendizaje() {
    recompensaAcumulada = 0;
    historialRecompensas = [0];
    contadorPasos = [0];
    pasoActual = 0;
    totalDecisiones = 0;
    aciertos = 0;
    falsosPositivos = 0;
    falsosNegativos = 0;

    const elAccion = document.getElementById('output-accion');
    if (elAccion) {
        elAccion.innerText = '---';
        elAccion.className = 'text-2xl font-bold text-slate-400';
    }

    const elMetodo = document.getElementById('output-metodo');
    if (elMetodo) elMetodo.innerText = 'Esperando interacción...';

    const elRecompensa = document.getElementById('output-recompensa');
    if (elRecompensa) {
        elRecompensa.innerText = '0';
        elRecompensa.className = 'text-xl font-bold text-slate-800';
    }

    if (chartAprendizaje) {
        chartAprendizaje.data.labels = [0];
        chartAprendizaje.data.datasets[0].data = [0];
        chartAprendizaje.update();
    }

    actualizarMetricas();
    actualizarTablaQ();
}

function actualizarMetricas() {
    const metricTotal = document.getElementById('metric-recompensa-total');
    const metricPromedio = document.getElementById('metric-promedio');
    const metricPasos = document.getElementById('metric-pasos');

    metricTotal.innerText = recompensaAcumulada.toFixed(1);
    metricPromedio.innerText = pasoActual > 0 ? (recompensaAcumulada / pasoActual).toFixed(2) : '0.00';
    metricPasos.innerText = pasoActual;

    const statsTotal = document.getElementById('stats-recompensa-acumulada');
    const statsPromedio = document.getElementById('stats-promedio-paso');
    if (statsTotal) statsTotal.innerText = recompensaAcumulada.toFixed(1);
    if (statsPromedio) statsPromedio.innerText = pasoActual > 0 ? (recompensaAcumulada / pasoActual).toFixed(2) : '0.00';

    // Actualizar métricas de rendimiento en la pestaña de estadísticas si están presentes
    const elTotal = document.getElementById('metric-total');
    const elAciertos = document.getElementById('metric-aciertos');
    const elFP = document.getElementById('metric-falsos-positivos');
    const elFN = document.getElementById('metric-falsos-negativos');
    const elPrec = document.getElementById('metric-precision');
    if (elTotal) elTotal.innerText = totalDecisiones;
    if (elAciertos) elAciertos.innerText = aciertos;
    if (elFP) elFP.innerText = falsosPositivos;
    if (elFN) elFN.innerText = falsosNegativos;
    if (elPrec) elPrec.innerText = totalDecisiones ? (aciertos / totalDecisiones * 100).toFixed(1) + '%' : '0%';

    // Si la pestaña de estadísticas está visible, refrescar la tabla Q
    const tabEst = document.getElementById('tab-estadisticas');
    if (tabEst && !tabEst.classList.contains('hidden')) {
        actualizarTablaQ();
    }
}

async function actualizarTablaQ() {
    const tablaBody = document.getElementById('q-table-body');
    const statsEstados = document.getElementById('stats-estados-explorados');

    if (!tablaBody) return;

    try {
        const res = await fetch(`${API_URL}/q-table`);
        const data = await res.json();
        const estados = Object.entries(data || {});

        if (statsEstados) {
            statsEstados.innerText = estados.length;
        }

        if (estados.length === 0) {
            tablaBody.innerHTML = '<tr class="border-t border-slate-200"><td colspan="3" class="px-3 py-2 text-slate-500">No hay estados aprendidos todavía.</td></tr>';
            return;
        }

        const filas = estados.flatMap(([estado, acciones]) => {
            return Object.entries(acciones || {}).map(([accion, valor]) => `
                <tr class="border-t border-slate-200">
                    <td class="px-3 py-2">${estado.replaceAll('_', ' / ')}</td>
                    <td class="px-3 py-2">${accion}</td>
                    <td class="px-3 py-2 ${valor >= 0 ? 'text-emerald-600' : 'text-red-500'}">${Number(valor).toFixed(2)}</td>
                </tr>
            `);
        });

        tablaBody.innerHTML = filas.join('');
    } catch (error) {
        console.error('No se pudo cargar la tabla Q:', error);
        tablaBody.innerHTML = '<tr class="border-t border-slate-200"><td colspan="3" class="px-3 py-2 text-red-500">No se pudo cargar la tabla Q.</td></tr>';
    }
}

actualizarMetricas();
actualizarTablaQ();

// Tarjetas interactivas de la sección de fundamentos
document.querySelectorAll('[data-card-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const target = document.getElementById(targetId);
        const isOpen = !target.classList.contains('hidden');

        document.querySelectorAll('[data-card-toggle]').forEach((otherButton) => {
            const otherTarget = document.getElementById(otherButton.getAttribute('data-target'));
            otherTarget.classList.add('hidden');
            otherButton.setAttribute('aria-expanded', 'false');
            const otherIcon = otherButton.querySelector('.toggle-icon');
            if (otherIcon) otherIcon.textContent = '+';
        });

        if (!isOpen) {
            target.classList.remove('hidden');
            button.setAttribute('aria-expanded', 'true');
            const icon = button.querySelector('.toggle-icon');
            if (icon) icon.textContent = '−';
        }
    });
});

async function procesarEvaluacion(estadoActual, esFraudeReal) {
    try {
        const resDecide = await fetch(`${API_URL}/decide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(estadoActual)
        });
        const dataDecide = await resDecide.json();
        const accionAgente = dataDecide.action;

        const elAccion = document.getElementById('output-accion');
        elAccion.innerText = accionAgente;
        if (accionAgente === 'Aprobar') {
            elAccion.className = 'text-2xl font-bold text-sky-400';
        } else {
            elAccion.className = 'text-2xl font-bold text-amber-500';
        }
        document.getElementById('output-metodo').innerText = `Decidido vía: ${dataDecide.metodo}`;

        const recompensa = calcularRecompensa(accionAgente, esFraudeReal);

        totalDecisiones++;
        const esAcierto = (esFraudeReal && accionAgente === 'Bloquear') || (!esFraudeReal && accionAgente === 'Aprobar');
        if (esAcierto) aciertos++;
        else {
            if (esFraudeReal) falsosNegativos++;
            else falsosPositivos++;
        }

        const elTotal = document.getElementById('metric-total');
        const elAciertos = document.getElementById('metric-aciertos');
        const elFP = document.getElementById('metric-falsos-positivos');
        const elFN = document.getElementById('metric-falsos-negativos');
        const elPrec = document.getElementById('metric-precision');
        if (elTotal) elTotal.innerText = totalDecisiones;
        if (elAciertos) elAciertos.innerText = aciertos;
        if (elFP) elFP.innerText = falsosPositivos;
        if (elFN) elFN.innerText = falsosNegativos;
        if (elPrec) elPrec.innerText = totalDecisiones ? (aciertos / totalDecisiones * 100).toFixed(1) + '%' : '0%';

        const elRecompensa = document.getElementById('output-recompensa');
        elRecompensa.innerText = (recompensa > 0 ? `+${recompensa}` : recompensa);
        elRecompensa.className = recompensa > 0 ? 'text-xl font-bold text-emerald-400' : 'text-xl font-bold text-red-500';

        const siguienteEstado = obtenerEstadoAleatorio();
        await fetch(`${API_URL}/learn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                state: dataDecide.state,
                action: accionAgente,
                reward: recompensa,
                next_monto: siguienteEstado.monto,
                next_ubicacion: siguienteEstado.ubicacion,
                next_dispositivo: siguienteEstado.dispositivo,
                next_hora: siguienteEstado.hora,
                next_frecuencia: siguienteEstado.frecuencia
            })
        });

        pasoActual++;
        recompensaAcumulada += recompensa;
        historialRecompensas.push(recompensaAcumulada);
        contadorPasos.push(pasoActual);
        actualizarMetricas();
        await actualizarTablaQ();
        chartAprendizaje.update();
    } catch (error) {
        console.error('Error conectando con el backend en Flask:', error);
        alert("¡Alerta! Asegúrate de tener corriendo tu servidor Flask ejecutando 'python server.py' en la carpeta backend.");
    }
}

async function entrenar(pasos) {
    const btnEntrenar = document.getElementById('btn-entrenar');
    const btnEvaluar = document.getElementById('btn-evaluar');
    if (btnEntrenar) {
        btnEntrenar.disabled = true;
        btnEntrenar.classList.add('opacity-60', 'cursor-not-allowed');
    }
    if (btnEvaluar) {
        btnEvaluar.disabled = true;
        btnEvaluar.classList.add('opacity-60', 'cursor-not-allowed');
    }

    try {
        for (let i = 0; i < pasos; i++) {
            const estadoActual = obtenerEstadoAleatorio();
            const esFraudeReal = Math.random() < 0.5;
            await procesarEvaluacion(estadoActual, esFraudeReal);
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    } finally {
        if (btnEntrenar) {
            btnEntrenar.disabled = false;
            btnEntrenar.classList.remove('opacity-60', 'cursor-not-allowed');
        }
        if (btnEvaluar) {
            btnEvaluar.disabled = false;
            btnEvaluar.classList.remove('opacity-60', 'cursor-not-allowed');
        }
    }
}

// Evento al presionar el botón de evaluar
document.getElementById('btn-evaluar').addEventListener('click', async () => {
    const estadoActual = {
        monto: document.getElementById('monto').value,
        ubicacion: document.getElementById('ubicacion').value,
        dispositivo: document.getElementById('dispositivo').value,
        hora: document.getElementById('hora').value,
        frecuencia: document.getElementById('frecuencia').value
    };

    const esFraudeReal = document.getElementById('es_fraude').value === 'true';
    await procesarEvaluacion(estadoActual, esFraudeReal);
});

// Evento al presionar el botón de entrenamiento automático
document.getElementById('btn-entrenar').addEventListener('click', async () => {
    await entrenar(20);
});

document.getElementById('btn-reset')?.addEventListener('click', async () => {
    const confirmar = confirm('Se borrará la tabla Q y se reiniciará el aprendizaje desde cero. ¿Deseas continuar?');
    if (!confirmar) return;

    try {
        const res = await fetch(`${API_URL}/reset`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo reiniciar');
        resetAprendizaje();
        alert(data.message || 'Aprendizaje reiniciado correctamente.');
    } catch (error) {
        console.error('Error al reiniciar el aprendizaje:', error);
        alert('No se pudo reiniciar el aprendizaje.');
    }
});

// Manejo de pestañas
 document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((tabButton) => {
            tabButton.classList.remove('active', 'bg-blue-500', 'text-white');
            tabButton.classList.add('bg-gray-200', 'text-gray-700');
        });

        btn.classList.add('active', 'bg-blue-500', 'text-white');
        btn.classList.remove('bg-gray-200', 'text-gray-700');

        document.querySelectorAll('.tab-content').forEach((content) => {
            content.classList.add('hidden');
        });

        const targetId = `tab-${btn.dataset.tab}`;
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.remove('hidden');
            if (btn.dataset.tab === 'estadisticas') {
                actualizarTablaQ();
            }
            if (typeof chartAprendizaje?.resize === 'function') {
                setTimeout(() => chartAprendizaje.resize(), 0);
            }
        }
    });
});