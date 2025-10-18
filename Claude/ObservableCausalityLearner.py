import numpy as np
from typing import List, Tuple, Dict, Set
from dataclasses import dataclass
from enum import Enum

class ObservableState(Enum):
    UNOBSERVED = "unobserved"
    OBSERVED = "observed"
    COLLAPSED = "collapsed"

@dataclass
class SpacetimeEvent:
    t: float  # time coordinate
    x: int    # board x coordinate
    y: int    # board y coordinate
    z: int    # quantum state
    piece_type: str
    player: int  # 1 or -1 for different players
    observable_state: ObservableState = ObservableState.UNOBSERVED

@dataclass
class CausalityViolation:
    event1: SpacetimeEvent
    event2: SpacetimeEvent
    violation_type: str
    severity: float

class ObservableCausalityLearner:
    def __init__(self, learning_rate: float = 0.01, memory_size: int = 1000):
        self.learning_rate = learning_rate
        self.memory_size = memory_size
        self.violation_history: List[CausalityViolation] = []
        self.causal_rules: Dict[str, float] = {
            "timelike_separation": 1.0,
            "lightcone_boundary": 1.0,
            "simultaneity_threshold": 0.5,
            "quantum_interference": 0.3,
            "observation_radius": 2.0  # Radius within which pieces become observable
        }
        self.position_weights = np.zeros((4, 8, 8, 2))  # (t, x, y, z)
        self.observed_positions: Set[Tuple[int, int, int, int]] = set()  # Track observed positions

    def spacetime_interval(self, event1: SpacetimeEvent, event2: SpacetimeEvent) -> float:
        """Calculate Minkowski spacetime interval between two events"""
        dt = event2.t - event1.t
        dx = event2.x - event1.x
        dy = event2.y - event1.y
        dz = event2.z - event1.z
        return -dt**2 + dx**2 + dy**2 + dz**2

    def is_observable(self, event1: SpacetimeEvent, event2: SpacetimeEvent) -> bool:
        """Determine if two events can observe each other"""
        interval = self.spacetime_interval(event1, event2)
        # Events must be timelike separated to observe each other
        if interval >= 0:
            return False
        # Check if within observation radius
        spatial_distance = np.sqrt((event2.x - event1.x)**2 + 
                                 (event2.y - event1.y)**2)
        return spatial_distance <= self.causal_rules["observation_radius"]

    def update_observable_states(self, events: List[SpacetimeEvent]):
        """Update observable states based on piece positions and quantum states"""
        for i, event1 in enumerate(events):
            for event2 in events[i+1:]:
                if self.is_observable(event1, event2):
                    # If either piece is in classical state (z=0), it forces observation
                    if event1.z == 0 or event2.z == 0:
                        event1.observable_state = ObservableState.OBSERVED
                        event2.observable_state = ObservableState.OBSERVED
                        # Record observed positions
                        self.observed_positions.add((int(event1.t), event1.x, event1.y, event1.z))
                        self.observed_positions.add((int(event2.t), event2.x, event2.y, event2.z))

    def quantum_collapse_check(self, event: SpacetimeEvent) -> bool:
        """Check if a quantum state should collapse due to observation"""
        if event.z == 1 and event.observable_state == ObservableState.OBSERVED:
            # Quantum state collapses to classical when observed
            event.z = 0
            event.observable_state = ObservableState.COLLAPSED
            return True
        return False

    def is_causal_violation(self, event1: SpacetimeEvent, event2: SpacetimeEvent) -> Tuple[bool, str, float]:
        """Check if two events violate causality, including observation constraints"""
        interval = self.spacetime_interval(event1, event2)
        
        # Check various types of violations
        if interval > 0 and event1.t < event2.t:
            return True, "spacelike_separation", abs(interval)
        
        if event1.t > event2.t:
            return True, "backward_time", abs(event1.t - event2.t)
            
        if event1.z != event2.z and interval > self.causal_rules["quantum_interference"]:
            return True, "quantum_violation", abs(interval)
            
        # New observation-based violations
        if (event1.observable_state == ObservableState.OBSERVED and 
            event1.z == 1 and interval > 0):
            return True, "observation_violation", abs(interval)
            
        if (event1.observable_state == ObservableState.COLLAPSED and 
            event2.observable_state != ObservableState.COLLAPSED and
            self.is_observable(event1, event2)):
            return True, "collapse_violation", 1.0
            
        return False, "", 0.0

    def learn_from_game(self, game_events: List[SpacetimeEvent]):
        """Update causal rules based on a completed game"""
        # First update observable states
        self.update_observable_states(game_events)
        
        violations = []
        # Check for quantum collapses
        for event in game_events:
            if self.quantum_collapse_check(event):
                # Adjust rules based on collapse
                self.causal_rules["quantum_interference"] *= (1 - self.learning_rate)
        
        # Check all pairs of events for violations
        for i, event1 in enumerate(game_events):
            for event2 in game_events[i+1:]:
                is_violation, vtype, severity = self.is_causal_violation(event1, event2)
                if is_violation:
                    violation = CausalityViolation(event1, event2, vtype, severity)
                    violations.append(violation)
                    self.update_rules(violation)

        # Update position weights based on violations
        self.update_position_weights(violations)
        
        # Maintain finite history
        self.violation_history.extend(violations)
        if len(self.violation_history) > self.memory_size:
            self.violation_history = self.violation_history[-self.memory_size:]

    def get_observation_safety(self, event: SpacetimeEvent) -> float:
        """Calculate how safe a position is regarding observation rules"""
        if event.z == 0:  # Classical states are always safe
            return 1.0
            
        safety = 1.0
        # Check distance to all observed positions
        for obs_pos in self.observed_positions:
            t, x, y, z = obs_pos
            interval = self.spacetime_interval(
                event,
                SpacetimeEvent(t=float(t), x=x, y=y, z=z, 
                              piece_type="", player=0)
            )
            if interval < 0:  # Timelike separation
                dist = np.sqrt((event.x - x)**2 + (event.y - y)**2)
                if dist <= self.causal_rules["observation_radius"]:
                    safety *= 0.5  # Reduce safety near observed positions
                    
        return safety

    def suggest_safer_move(self, dangerous_move: SpacetimeEvent) -> SpacetimeEvent:
        """Suggest an alternative move that's less likely to violate causality and observation rules"""
        best_score = -float('inf')
        best_move = dangerous_move
        
        # Check nearby positions in spacetime
        for dt in [-1, 0, 1]:
            new_t = dangerous_move.t + dt
            if 0 <= new_t <= 3:
                for dx in [-1, 0, 1]:
                    new_x = dangerous_move.x + dx
                    if 0 <= new_x <= 7:
                        for dy in [-1, 0, 1]:
                            new_y = dangerous_move.y + dy
                            if 0 <= new_y <= 7:
                                for new_z in [0, 1]:
                                    candidate = SpacetimeEvent(
                                        t=new_t, x=new_x, y=new_y, z=new_z,
                                        piece_type=dangerous_move.piece_type,
                                        player=dangerous_move.player,
                                        observable_state=ObservableState.UNOBSERVED
                                    )
                                    # Combine regular safety with observation safety
                                    move_safety = self.get_move_safety_score(candidate)
                                    obs_safety = self.get_observation_safety(candidate)
                                    total_safety = move_safety * obs_safety
                                    
                                    if total_safety > best_score:
                                        best_score = total_safety
                                        best_move = candidate
        
        return best_move

    def analyze_observation_patterns(self) -> Dict[str, float]:
        """Analyze patterns in quantum observations and collapses"""
        patterns = {
            "collapse_rate": 0,
            "observation_violations": 0,
            "quantum_survival_rate": 0,
            "average_observation_distance": 0,
            "classical_dominance": 0
        }
        
        total_quantum_states = 0
        total_collapses = 0
        total_observations = 0
        observation_distances = []
        
        for violation in self.violation_history:
            if violation.violation_type == "observation_violation":
                patterns["observation_violations"] += 1
                
            # Track quantum state collapses
            if violation.event1.observable_state == ObservableState.COLLAPSED:
                total_collapses += 1
            if violation.event1.z == 1:
                total_quantum_states += 1
                
            # Calculate observation distances
            if violation.event1.observable_state == ObservableState.OBSERVED:
                total_observations += 1
                dist = np.sqrt((violation.event1.x - violation.event2.x)**2 +
                             (violation.event1.y - violation.event2.y)**2)
                observation_distances.append(dist)
        
        # Calculate derived metrics
        if total_quantum_states > 0:
            patterns["collapse_rate"] = total_collapses / total_quantum_states
            patterns["quantum_survival_rate"] = 1 - patterns["collapse_rate"]
            
        if observation_distances:
            patterns["average_observation_distance"] = np.mean(observation_distances)
            
        if total_observations > 0:
            patterns["classical_dominance"] = len(self.observed_positions) / total_observations
            
        return patterns
