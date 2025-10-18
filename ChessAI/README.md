Here’s a **Python implementation** of a **Finite State Machine (FSM) AI** that responds to a player’s move based only on their last move, without knowing the board configuration.

---

### **How It Works**
- Uses a **dictionary mapping** to define responses for common moves.
- If the move isn’t predefined, it falls back to a **random safe response**.
- Implements a **Finite State Machine (FSM)** where:
  - `STATE_OPENING` → Early game (first few moves).
  - `STATE_MIDGAME` → Mid-game response.
  - `STATE_ENDGAME` → Endgame heuristics.

---

### **Python Code: Chess FSM AI**
```python
import random

class ChessAI:
    STATE_OPENING = "opening"
    STATE_MIDGAME = "midgame"
    STATE_ENDGAME = "endgame"

    def __init__(self):
        self.state = self.STATE_OPENING
        self.move_response_map = {
            "e4": ["e5", "c5", "d5"],   # Respond to 1. e4
            "d4": ["d5", "Nf6", "e6"],   # Respond to 1. d4
            "c4": ["e5", "c5", "d5"],   # English Opening response
            "Nf3": ["d5", "c5", "Nf6"],  # Knight move
            "Nc3": ["d5", "e5"],         # Develop response
            "Bb5": ["a6", "Nc6"],        # Spanish Game response
            "Bc4": ["e6", "d6", "Nf6"],  # Italian Game response
            "Qh5": ["Nc6", "g6"],        # Prevent Scholar's Mate
            "O-O": ["d5", "c5", "h5"],   # Respond to kingside castling
            "O-O-O": ["c5", "b5"],       # Respond to queenside castling
            "h4": ["d5", "e5"],          # Early aggressive pawn push
        }

    def get_response(self, player_move):
        """ Returns AI response based on player's last move. """
        if self.state == self.STATE_OPENING:
            if player_move in self.move_response_map:
                return random.choice(self.move_response_map[player_move])
            else:
                # If unknown move, play a safe central move
                return random.choice(["e5", "d5", "Nf6"])

        elif self.state == self.STATE_MIDGAME:
            return self.midgame_strategy(player_move)

        elif self.state == self.STATE_ENDGAME:
            return self.endgame_strategy()

        return "Nf6"  # Default safe move if no rule applies

    def midgame_strategy(self, player_move):
        """ Simplified midgame strategy based on basic heuristics. """
        attack_moves = ["c5", "d5", "e5", "f5", "Qd6"]
        defensive_moves = ["Be7", "g6", "Nf6", "h6"]
        if player_move in ["Qg4", "Bh6"]:  # If opponent is attacking aggressively
            return random.choice(defensive_moves)
        return random.choice(attack_moves)

    def endgame_strategy(self):
        """ Basic endgame principles. """
        king_moves = ["Kf7", "Ke7", "Kd7"]
        pawn_pushes = ["e5", "d5", "f5"]
        return random.choice(king_moves + pawn_pushes)

    def update_state(self, move_count):
        """ Updates AI's internal game state based on move count. """
        if move_count > 10:
            self.state = self.STATE_MIDGAME
        if move_count > 30:
            self.state = self.STATE_ENDGAME

# Example usage
ai = ChessAI()
move_count = 1
player_moves = ["e4", "Nf3", "Bb5", "O-O", "Qh5"]  # Simulated player moves

for move in player_moves:
    ai.update_state(move_count)
    response = ai.get_response(move)
    print(f"Player: {move} → AI: {response}")
    move_count += 1
```

---

### **How It Responds**
| Player Move | AI Response (Example) |
|------------|----------------------|
| `e4`  | `e5` or `c5` or `d5` |
| `Nf3` | `d5` or `c5` or `Nf6` |
| `Bb5` | `a6` or `Nc6` |
| `O-O` | `d5` or `c5` or `h5` |
| `Qh5` | `Nc6` or `g6` |

---

### **Features**
✅ **Finite State Machine (FSM)**
- **Opening strategy** → Early center control, preventing traps.
- **Midgame heuristics** → Attack/defense based on simple rules.
- **Endgame principles** → King activation & pawn promotion.

✅ **Move-Response Mapping**
- Uses a predefined dictionary to map opponent moves to optimal responses.

✅ **Fallback Mechanism**
- If an unknown move is played, AI defaults to **safe central control moves**.

✅ **Expandable**
- You can easily **extend the move-response rules** for more advanced strategies.

---

### **Next Steps**
- Want to add **machine learning**? Use **Reinforcement Learning (RL)** to improve responses over time.
- Need **better positional play**? Integrate a simple evaluation function.
- Want to turn this into a **bot**? Hook it up with **Stockfish API** for deeper calculations.

Would you like modifications, such as adding **defense against traps** or **different opening styles**? 🚀
