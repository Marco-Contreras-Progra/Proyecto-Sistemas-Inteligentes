from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import json
import os

app = Flask(__name__)
CORS(app)  # Permite que tu frontend se comunique con el backend sin bloqueos de seguridad

# --- PARÁMETROS DE APRENDIZAJE POR REFUERZO ---
alpha = 0.2    # Tasa de aprendizaje (Learning Rate)
# Contextual bandit: transacciones independientes → no discounting
gamma = 0.0    # Factor de descuento (se configura a 0 para problemas tipo Bandit Contextual)
epsilon = 0.15 # Tasa de exploración (Probabilidad de intentar algo nuevo)

# La Tabla Q se almacenará en memoria como un diccionario de diccionarios
# Estructura: { "Estado_String": {"Aprobar": valor_Q, "Bloquear": valor_Q} }
q_table = {}
ACTIONS = ["Aprobar", "Bloquear"]
Q_TABLE_FILE = os.path.join(os.path.dirname(__file__), 'q_table.json')


def load_q_table():
    """Carga la tabla Q desde un archivo JSON si existe."""
    global q_table
    if os.path.exists(Q_TABLE_FILE):
        try:
            with open(Q_TABLE_FILE, 'r', encoding='utf-8') as f:
                q_table = json.load(f)
        except (json.JSONDecodeError, OSError):
            q_table = {}


def save_q_table():
    """Guarda la tabla Q en un archivo JSON."""
    try:
        with open(Q_TABLE_FILE, 'w', encoding='utf-8') as f:
            json.dump(q_table, f, indent=2, ensure_ascii=False)
    except OSError:
        pass


def reset_q_table():
    """Borra la tabla Q en memoria y elimina el archivo persistido."""
    global q_table
    q_table = {}
    try:
        if os.path.exists(Q_TABLE_FILE):
            os.remove(Q_TABLE_FILE)
    except OSError:
        pass
    return True


def get_or_create_q_values(state_str):
    """Si el estado es nuevo para el agente, lo inicializa en 0."""
    if state_str not in q_table:
        q_table[state_str] = {action: 0.0 for action in ACTIONS}
    return q_table[state_str]

# --- ENDPOINTS DE LA API ---

@app.route('/decide', methods=['POST'])
def decide():
    """El frontend le envía las 5 variables y el agente elige una acción."""
    data = request.json
    
    # Construimos la representación del estado
    state = f"{data['monto']}_{data['ubicacion']}_{data['dispositivo']}_{data['hora']}_{data['frecuencia']}"
    q_values = get_or_create_q_values(state)
    
    # Estrategia Epsilon-Greedy (Exploración vs. Explotación)
    if random.random() < epsilon:
        action = random.choice(ACTIONS)
        metodo = "Exploración (Azar)"
    else:
        # Elige la acción con el valor Q más alto
        action = max(q_values, key=q_values.get)
        metodo = "Explotación (Política)"
        
    return jsonify({
        "state": state,
        "action": action,
        "metodo": metodo,
        "q_values": q_values
    })

@app.route('/learn', methods=['POST'])
def learn():
    """El entorno le dice al agente qué recompensa obtuvo y este actualiza su conocimiento."""
    data = request.json
    
    state = data['state']
    action = data['action']
    reward = float(data['reward'])
    
    # Construimos el siguiente estado (al que se transiciona)
    next_state = f"{data['next_monto']}_{data['next_ubicacion']}_{data['next_dispositivo']}_{data['next_hora']}_{data['next_frecuencia']}"
    
    q_values = get_or_create_q_values(state)
    next_q_values = get_or_create_q_values(next_state)
    
    # Buscamos el mejor valor Q posible en el siguiente estado
    max_next_q = max(next_q_values.values())
    
    # Ecuación clásica de Bellman para Q-Learning:
    # Q(s,a) = Q(s,a) + alpha * (reward + gamma * max(Q(s',a')) - Q(s,a))
    q_values[action] = q_values[action] + alpha * (reward + gamma * max_next_q - q_values[action])
    
    save_q_table()
    
    return jsonify({
        "status": "success",
        "updated_q_values": q_values
    })

@app.route('/q-table', methods=['GET'])
def get_all_q_table():
    """Devuelve todo lo que el agente ha aprendido para mostrarlo en una tabla en la web."""
    load_q_table()
    return jsonify(q_table)

@app.route('/reset', methods=['DELETE'])
def reset_endpoint():
    """Reinicia la tabla Q desde cero y borra la copia persistida en disco."""
    reset_q_table()
    return jsonify({
        "status": "success",
        "message": "Tabla Q reiniciada"
    })

if __name__ == '__main__':
    load_q_table()
    # Correr el servidor en el puerto 5000
    app.run(port=5000, debug=True)