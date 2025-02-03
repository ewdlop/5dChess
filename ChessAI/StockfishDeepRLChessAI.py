import torch
import torch.nn as nn
import torch.optim as optim
import random
import chess
import chess.engine
import onnx
import onnxruntime as ort

STOCKFISH_PATH = "/usr/games/stockfish"  # Adjust this for your system

class DQN(nn.Module):
    def __init__(self, input_size, output_size):
        super(DQN, self).__init__()
        self.fc1 = nn.Linear(input_size, 64)
        self.fc2 = nn.Linear(64, 64)
        self.fc3 = nn.Linear(64, output_size)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

class DeepRLChessAI:
    def __init__(self):
        self.actions = ["e5", "d5", "Nf6", "c5", "e6", "a6", "h6", "g6", "b5"]
        self.state_size = len(self.actions)
        self.action_size = len(self.actions)
        self.model = DQN(self.state_size, self.action_size)
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.01)
        self.criterion = nn.MSELoss()
        self.stockfish = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)

    def get_state_vector(self, move):
        """ Convert move into a one-hot encoded state vector. """
        state = [0] * self.state_size
        if move in self.actions:
            state[self.actions.index(move)] = 1
        return torch.tensor(state, dtype=torch.float32)

    def get_best_action(self, state):
        """ Get the best action based on the model's prediction. """
        with torch.no_grad():
            q_values = self.model(state)
        return self.actions[torch.argmax(q_values).item()]

    def train_step(self, opponent_move):
        """ Train the model using Deep Q-Learning. """
        state = self.get_state_vector(opponent_move)
        best_action = self.get_best_action(state)

        board = chess.Board()
        board.push_san(opponent_move)
        board.push_san(best_action)

        result = self.stockfish.play(board, chess.engine.Limit(time=0.1))
        board.push(result.move)

        evaluation = self.stockfish.analyse(board, chess.engine.Limit(time=0.1))["score"].relative.score()
        reward = evaluation / 100 if evaluation else 0

        target = reward + 0.9 * torch.max(self.model(state)).item()
        target_q_values = self.model(state)
        target_q_values[self.actions.index(best_action)] = target

        self.optimizer.zero_grad()
        loss = self.criterion(self.model(state), target_q_values)
        loss.backward()
        self.optimizer.step()

    def train(self, episodes=1000):
        for _ in range(episodes):
            opponent_move = random.choice(["e4", "d4", "Nf3", "Bb5", "O-O", "Qh5"])
            self.train_step(opponent_move)

    def save_onnx(self, filename="dqn_chess.onnx"):
        """ Convert and save the trained model as ONNX format """
        dummy_input = torch.randn(1, self.state_size)
        torch.onnx.export(
            self.model,
            dummy_input,
            filename,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=["input"],
            output_names=["output"]
        )
        print(f"Model saved to {filename}")

    def load_onnx(self, filename="dqn_chess.onnx"):
        """ Load the ONNX model for inference. """
        self.ort_session = ort.InferenceSession(filename)
        print(f"ONNX model loaded from {filename}")

    def infer_onnx(self, opponent_move):
        """ Run inference using ONNX model. """
        state_vector = self.get_state_vector(opponent_move).numpy().reshape(1, -1)
        inputs = {"input": state_vector}
        outputs = self.ort_session.run(None, inputs)
        best_action = self.actions[int(torch.argmax(torch.tensor(outputs[0])))]
        return best_action

    def close(self):
        self.stockfish.quit()

# Train AI and save ONNX
ai = DeepRLChessAI()
ai.train(episodes=1000)
ai.save_onnx()

# Load ONNX and test inference
ai.load_onnx()
test_move = "e4"
response = ai.infer_onnx(test_move)
print(f"Opponent: {test_move} → AI: {response}")

ai.close()
