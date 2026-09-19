"""
WATCH Budget Management Governor
Tracks and manages AI model usage/costs.
Gracefully degrades narrative AI generation when budget is constrained,
ensuring deterministic safety, protocol, and data integrity checks ALWAYS remain active.
"""

from dataclasses import dataclass, asdict, field
from typing import Any, Dict, List


@dataclass
class BudgetState:
    total_budget_usd: float = 100.0
    consumed_budget_usd: float = 18.50
    tier: str = "NORMAL"  # "NORMAL", "CAUTION" (>75%), "CONSTRAINED" (>85%), "CRITICAL" (>95%)
    narrative_generation_enabled: bool = True
    deterministic_checks_enabled: bool = True
    disabled_tasks: List[str] = field(default_factory=list)

    @property
    def percentage_used(self) -> float:
        return round((self.consumed_budget_usd / self.total_budget_usd) * 100, 1)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_budget_usd": self.total_budget_usd,
            "consumed_budget_usd": round(self.consumed_budget_usd, 2),
            "remaining_budget_usd": round(self.total_budget_usd - self.consumed_budget_usd, 2),
            "percentage_used": self.percentage_used,
            "tier": self.tier,
            "narrative_generation_enabled": self.narrative_generation_enabled,
            "deterministic_checks_enabled": self.deterministic_checks_enabled,
            "disabled_tasks": self.disabled_tasks,
        }


class BudgetGovernor:
    def __init__(self, total_budget_usd: float = 100.0, initial_consumed_usd: float = 18.50):
        self.state = BudgetState(total_budget_usd=total_budget_usd, consumed_budget_usd=initial_consumed_usd)
        self._update_tier()

    def record_usage(self, cost_usd: float, task_name: str = "query") -> BudgetState:
        self.state.consumed_budget_usd += cost_usd
        self._update_tier()
        return self.state

    def set_budget(self, consumed_usd: float) -> BudgetState:
        self.state.consumed_budget_usd = consumed_usd
        self._update_tier()
        return self.state

    def _update_tier(self) -> None:
        pct = self.state.percentage_used
        if pct >= 95.0:
            self.state.tier = "CRITICAL"
            self.state.narrative_generation_enabled = False
            self.state.disabled_tasks = [
                "Narrative clinical summary generation",
                "Conversational chat enrichment",
                "Long-form cycle report prose",
            ]
        elif pct >= 80.0:
            self.state.tier = "CONSTRAINED"
            self.state.narrative_generation_enabled = False
            self.state.disabled_tasks = [
                "Narrative clinical summary generation",
                "Long-form cycle report prose",
            ]
        elif pct >= 70.0:
            self.state.tier = "CAUTION"
            self.state.narrative_generation_enabled = True
            self.state.disabled_tasks = ["Long-form cycle report prose"]
        else:
            self.state.tier = "NORMAL"
            self.state.narrative_generation_enabled = True
            self.state.disabled_tasks = []

        # Deterministic checks NEVER disabled
        self.state.deterministic_checks_enabled = True
