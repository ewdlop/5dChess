import chess
import chess.engine
import numpy as np
import random
import safetensors.numpy as st

STOCKFISH_PATH = "/usr/games/stockfish"  # Change this to your Stockfish path

class StockfishRLChessAI:
    def __init__(self, stockfish_path=STOCKFISH_PATH, learning_rate=0.1, discount_factor=0.9, exploration_rate=0.2):
        self.q_table = {}  # {opponent move: {response: value}}
        self.alpha = learning_rate
        self.gamma = discount_factor
        self.epsilon = exploration_rate  # Exploration rate for random moves
        self.actions = ["e5", "d5", "Nf6", "c5", "e6", "a6", "h6", "g6", "b5"]  # Possible responses

        # Initialize Stockfish engine
        self.engine = chess.engine.SimpleEngine.popen_uci(stockfish_path)

    def get_best_response(self, opponent_move):
        """Choose the best move based on learned Q-values."""
        if opponent_move not in self.q_table:
            self.q_table[opponent_move] = {a: 0 for a in self.actions}

        if random.uniform(0, 1) < self.epsilon:
            return random.choice(self.actions)  # Explore
        else:
            return max(self.q_table[opponent_move], key=self.q_table[opponent_move].get)  # Exploit

    def play_against_stockfish(self, opponent_move):
        """Play against Stockfish and update Q-values."""
        chosen_action = self.get_best_response(opponent_move)

        # Create a new chess game
        board = chess.Board()
        board.push_san(opponent_move)  # Apply opponent's move
        board.push_san(chosen_action)  # AI responds

        # Stockfish move
        result = self.engine.play(board, chess.engine.Limit(time=0.1))
        board.push(result.move)

        # Evaluate the board
        evaluation = self.engine.analyse(board, chess.engine.Limit(time=0.1))["score"].relative.score()
        reward = 0 if evaluation is None else evaluation / 100  # Normalize score

        # Update Q-values
        self.update_q_value(opponent_move, chosen_action, reward)

        return chosen_action

    def update_q_value(self, opponent_move, chosen_action, reward):
        """Update Q-values using Q-learning."""
        if opponent_move not in self.q_table:
            self.q_table[opponent_move] = {a: 0 for a in self.actions}

        old_value = self.q_table[opponent_move][chosen_action]
        new_value = (1 - self.alpha) * old_value + self.alpha * (reward + self.gamma * max(self.q_table[opponent_move].values()))
        self.q_table[opponent_move][chosen_action] = new_value

    def save_q_table(self, filename="q_table.safetensors"):
        """Save Q-table as a SafeTensor file."""
        tensor_data = {key: np.array(list(value.values()), dtype=np.float32) for key, value in self.q_table.items()}
        st.save_file(tensor_data, filename)
        print(f"Q-table saved to {filename}")

    def load_q_table(self, filename="q_table.safetensors"):
        """Load Q-table from a SafeTensor file."""
        try:
            loaded_data = st.load_file(filename)
            self.q_table = {
                key: {action: loaded_data[key][i] for i, action in enumerate(self.actions)}
                for key in loaded_data.keys()
            }
            print(f"Q-table loaded from {filename}")
        except FileNotFoundError:
            print("No saved Q-table found, starting fresh.")

    def train_with_stockfish(self, episodes=1000):
        """Train against Stockfish by playing multiple games."""
        for _ in range(episodes):
            opponent_move = random.choice(["e4", "d4", "Nf3", "Bb5", "O-O", "Qh5"])
            self.play_against_stockfish(opponent_move)

        self.save_q_table()  # Save the trained model

    def close(self):
        """Close the Stockfish engine."""
        self.engine.quit()


# Train AI against Stockfish
ai = StockfishRLChessAI()
ai.train_with_stockfish(episodes=1000)  # Train for 1000 games
ai.close()
