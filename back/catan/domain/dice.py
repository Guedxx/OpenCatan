from __future__ import annotations

import random
from dataclasses import dataclass


@dataclass
class Dice:
    rng: random.Random | None = None
    last_values: tuple[int, int] | None = None

    def roll(self) -> int:
        rand = self.rng or random
        first = rand.randint(1, 6)
        second = rand.randint(1, 6)
        self.last_values = (first, second)
        return first + second
