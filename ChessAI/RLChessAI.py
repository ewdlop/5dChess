import numpy as np
import random
import safetensors.numpy as st

class RLChessAI:
    def __init__(self, learning_rate=0.1, discount_factor=0.9, exploration_rate=0.2):
        self.q_table = {}  # Q-table {state (opponent's move): {action: value}}
        self.alpha = learning_rate   # Learning rate
        self.gamma = discount_factor  # Discount factor
        self.epsilon = exploration_rate  # Exploration rate for random moves
        self.actions = ["e5", "d5", "Nf6", "c5", "e6", "a6", "h6", "g6", "b5"]  # Possible responses

    def get_best_response(self, opponent_move):
        """ Choose the best move based on learned Q-values. """
        if opponent_move not in self.q_table:
            self.q_table[opponent_move] = {a: 0 for a in self.actions}

        # Epsilon-greedy action selection (exploration vs exploitation)
        if random.uniform(0, 1) < self.epsilon:
            return random.choice(self.actions)  # Random move (exploration)
        else:
            return max(self.q_table[opponent_move], key=self.q_table[opponent_move].get)  # Best move (exploitation)

    def update_q_value(self, opponent_move, chosen_action, reward):
        """ Update Q-values based on feedback. """
        if opponent_move not in self.q_table:
            self.q_table[opponent_move] = {a: 0 for a in self.actions}

        old_value = self.q_table[opponent_move][chosen_action]
        new_value = (1 - self.alpha) * old_value + self.alpha * (reward + self.gamma * max(self.q_table[opponent_move].values()))
        self.q_table[opponent_move][chosen_action] = new_value

    def train(self, episodes=10000):
        """ Simulate training over multiple games. """
        for _ in range(episodes):
            opponent_move = random.choice(["e4", "d4", "Nf3", "Bb5", "O-O", "Qh5"])
            chosen_action = self.get_best_response(opponent_move)

            # Reward system
            reward = 0
            if chosen_action in ["e5", "d5"]:  # Good opening moves
                reward = 1
            elif chosen_action in ["g6", "h6"]:  # Defensive but not aggressive
                reward = -1
            elif chosen_action == "a6" and opponent_move == "Bb5":  # Kicking the bishop
                reward = 2
            elif chosen_action == "Nf6" and opponent_move == "Qh5":  # Preventing Scholar's Mate
                reward = 5

            # Update Q-table
            self.update_q_value(opponent_move, chosen_action, reward)

    def save_q_table(self, filename="q_table.safetensors"):
        """ Save Q-table as a SafeTensor file. """
        tensor_data = {key: np.array(list(value.values()), dtype=np.float32) for key, value in self.q_table.items()}
        st.save_file(tensor_data, filename)
        print(f"Q-table saved to {filename}")

    def load_q_table(self, filename="q_table.safetensors"):
        """ Load Q-table from a SafeTensor file. """
        try:
            loaded_data = st.load_file(filename)
            self.q_table = {
                key: {action: loaded_data[key][i] for i, action in enumerate(self.actions)}
                for key in loaded_data.keys()
            }
            print(f"Q-table loaded from {filename}")
        except FileNotFoundError:
            print("No saved Q-table found, starting fresh.")

    def play(self, opponent_moves):
        """ Let the trained AI respond to a sequence of moves. """
        for move in opponent_moves:
            response = self.get_best_response(move)
            print(f"Opponent: {move} → AI: {response}")

# Train and save AI
ai = RLChessAI()
ai.train(episodes=10000)
ai.save_q_table()

# Load and test AI
ai.load_q_table()
test_moves = ["e4", "Nf3", "Bb5", "O-O", "Qh5"]
ai.play(test_moves)
