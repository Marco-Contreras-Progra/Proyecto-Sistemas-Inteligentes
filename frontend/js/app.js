// URL del servidor Flask
const API_URL = "http://127.0.0.1:5000";

// Historial local para la gráfica
let recompensaAcumulada = 0;
let historialRecompensas = [0];
let contadorPasos = [0];
let pasoActual = 0;

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

function actualizarMetricas() {
    const metricTotal = document.getElementById('metric-recompensa-total');
    const metricPromedio = document.getElementById('metric-promedio');
    const metricPasos = document.getElementById('metric-pasos');

    metricTotal.innerText = recompensaAcumulada.toFixed(1);
    metricPromedio.innerText = pasoActual > 0 ? (recompensaAcumulada / pasoActual).toFixed(2) : '0.00';
    metricPasos.innerText = pasoActual;
}

actualizarMetricas();

// Evento al presionar el botón de evaluar
document.getElementById('btn-evaluar').addEventListener('click', async () => {
    // 1. Capturar los datos del formulario (Estado Actual)
    const estadoActual = {
        monto: document.getElementById('monto').value,
        ubicacion: document.getElementById('ubicacion').value,
        dispositivo: document.getElementById('dispositivo').value,
        hora: document.getElementById('hora').value,
        frecuencia: document.getElementById('frecuencia').value
    };

    const esFraudeReal = document.getElementById('es_fraude').value === "true";

    try {
        // 2. PEDIR DECISIÓN AL BACKEND FLASK
        const resDecide = await fetch(`${API_URL}/decide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(estadoActual)
        });
        const dataDecide = await resDecide.json();

        const accionAgente = dataDecide.action; // "Aprobar" o "Bloquear"
        
        // Actualizar interfaz con lo que decidió el agente
        const elAccion = document.getElementById('output-accion');
        elAccion.innerText = accionAgente;
        if(accionAgente === "Aprobar") {
            elAccion.className = "text-2xl font-bold text-sky-400";
        } else {
            elAccion.className = "text-2xl font-bold text-amber-500";
        }
        document.getElementById('output-metodo').innerText = `Decidido vía: ${dataDecide.metodo}`;

        // 3. CALCULAR RECOMPENSA 
        let recompensa = 0;
        if (esFraudeReal) {
            // Era un fraude
            recompensa = (accionAgente === "Bloquear") ? 2 : -10; // +2 por atraparlo, -10 si se le escapa
        } else {
            // Era una compra legítima de un cliente real
            recompensa = (accionAgente === "Aprobar") ? 1 : -5; // +1 por dejarlo comprar, -5 por falsa alarma (bloqueo injustificado)
        }

        // Mostrar recompensa en pantalla
        const elRecompensa = document.getElementById('output-recompensa');
        elRecompensa.innerText = (recompensa > 0 ? `+${recompensa}` : recompensa);
        elRecompensa.className = recompensa > 0 ? "text-xl font-bold text-emerald-400" : "text-xl font-bold text-red-500";

        // 4. GENERAR UN SIGUIENTE ESTADO ALEATORIO (Para el ciclo Markoviano)
        // Simulamos que tras esta transacción, el sistema avanza a otra aleatoria
        const opcionesMonto = ["Bajo", "Medio", "Alto"];
        const opcionesUbicacion = ["Local", "Internacional_Habitual", "Internacional_Sospechosa"];
        const opcionesDispositivo = ["Frecuente", "Nuevo"];
        const opcionesHora = ["Regular", "Madrugada"];
        const opcionesFrecuencia = ["Normal", "Alta_Frecuencia"];

        // 5. INFORMAR AL BACKEND PARA QUE APRENDA (Endpoint /learn)
        await fetch(`${API_URL}/learn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                state: dataDecide.state,
                action: accionAgente,
                reward: recompensa,
                next_monto: opcionesMonto[Math.floor(Math.random() * opcionesMonto.length)],
                next_ubicacion: opcionesUbicacion[Math.floor(Math.random() * opcionesUbicacion.length)],
                next_dispositivo: opcionesDispositivo[Math.floor(Math.random() * opcionesDispositivo.length)],
                next_hora: opcionesHora[Math.floor(Math.random() * opcionesHora.length)],
                next_frecuencia: opcionesFrecuencia[Math.floor(Math.random() * opcionesFrecuencia.length)]
            })
        });

        // 6. ACTUALIZAR GRÁFICA EN VIVO
        pasoActual++;
        recompensaAcumulada += recompensa;
        historialRecompensas.push(recompensaAcumulada);
        contadorPasos.push(pasoActual);
        actualizarMetricas();
        chartAprendizaje.update();

    } catch (error) {
        console.error("Error conectando con el backend en Flask:", error);
        alert("¡Alerta! Asegúrate de tener corriendo tu servidor Flask ejecutando 'python server.py' en la carpeta backend.");
    }
});