# Detector de Fraude con Aprendizaje por Refuerzo (Q‑Learning)

Aplicación web educativa que demuestra cómo un agente inteligente aprende a detectar transacciones fraudulentas mediante Q‑Learning. Incluye una interfaz interactiva para simular casos, visualizar la tabla de aprendizaje y observar la evolución del agente en tiempo real.

## Requisitos previos

- Python 3.7+ (con pip)
- Navegador web moderno (Chrome, Firefox, Edge)
- Conexión a Internet (para cargar librerías CDN – Tailwind, Chart.js, MathJax)

## Instalación y ejecución paso a paso

### 1. Clona o descarga el repositorio

```bash
git clone https://github.com/Marco-Contreras-Progra/Proyecto-Sistemas-Inteligentes.git
cd Proyecto-Sistemas-Inteligentes
```

Si no usas Git, descarga el archivo ZIP y descomprime la carpeta.

### 2. Crea y activa un entorno virtual (recomendado)

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

#### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Instala las dependencias del backend

```bash
pip install flask flask-cors
```

### 4. Ejecuta el servidor Flask

Desde la carpeta del backend, ejecuta:

```bash
cd backend
../env/bin/python server.py
```

Verás un mensaje como:

```text
* Running on http://127.0.0.1:5000
* Debugger is active!
```

No cierres esta terminal; el servidor debe permanecer en ejecución.

### 5. Abre la aplicación web

El frontend está en la carpeta frontend. Puedes abrirlo de dos maneras:

- Recomendado: con la extensión Live Server de Visual Studio Code (clic derecho → Open with Live Server). Se abrirá en http://127.0.0.1:5500.
- Alternativa: haz doble clic sobre index.html para abrirlo directamente en el navegador (ruta file://...).

Asegúrate de que el backend esté corriendo en http://127.0.0.1:5000 para que las peticiones funcionen.

## Cómo usar la aplicación

La interfaz está organizada en tres pestañas:

### Teoría

- Explicación de los conceptos de Aprendizaje por Refuerzo.
- Descripción de los parámetros del agente (α, γ, ε).
- Fórmula de Q‑Learning (con MathJax).
- Conclusiones y referencias bibliográficas.

### Simulador

- Selecciona los atributos de una transacción:
  - Monto (Bajo / Medio / Alto)
  - Ubicación (Local / Internacional Habitual / País de Alto Riesgo)
  - Dispositivo (Frecuente / Nuevo)
  - Hora (Regular / Madrugada)
  - Frecuencia (Normal / Alta)
- Indica si la transacción es legítima o fraudulenta.
- Haz clic en "Enviar caso a evaluar..." para que el agente decida (aprobar o bloquear).
- Observa la decisión, la recompensa obtenida y cómo se actualizan la gráfica de aprendizaje y las métricas.
- También puedes usar el botón "Entrenar 20 pasos" para ejecutar simulaciones automáticas y acelerar el aprendizaje.

### Tabla Q y Estadísticas

- Muestra todas las combinaciones de estados aprendidas y sus valores Q.
- Estadísticas de rendimiento: total de decisiones, aciertos, falsos positivos, falsos negativos y precisión.
- Botón "Reiniciar aprendizaje" para borrar la tabla Q y empezar de cero (requiere confirmación).

## Estructura de archivos

```text
/
├── backend/
│   ├── server.py          # Backend Flask (agente Q‑Learning)
│   └── q_table.json       # Persistencia de la tabla Q (se crea automáticamente)
├── frontend/
│   ├── index.html         # Frontend (interfaz web)
│   └── js/
│       └── app.js         # Lógica del frontend (peticiones, gráficas, eventos)
└── README.md              # Este archivo
```

## Referencias

- Sutton, R. S., & Barto, A. G. (2018). Reinforcement Learning: An Introduction. MIT Press.
- Documentación de Flask: https://flask.palletsprojects.com/
- Chart.js: https://www.chartjs.org/

