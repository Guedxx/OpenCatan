from __future__ import annotations

import random

from catan.topology.standard_board import TILES_NEIGHBOURS
from catan.domain.enums import PortType, ResourceType

BASE_RESOURCE_DISTRIBUTION: list[ResourceType] = [
    ResourceType.BRICK,
    ResourceType.BRICK,
    ResourceType.BRICK,
    ResourceType.LUMBER,
    ResourceType.LUMBER,
    ResourceType.LUMBER,
    ResourceType.LUMBER,
    ResourceType.WOOL,
    ResourceType.WOOL,
    ResourceType.WOOL,
    ResourceType.WOOL,
    ResourceType.GRAIN,
    ResourceType.GRAIN,
    ResourceType.GRAIN,
    ResourceType.GRAIN,
    ResourceType.ORE,
    ResourceType.ORE,
    ResourceType.ORE,
    ResourceType.DESERT,
]

BASE_NUMBER_TOKENS: list[int] = [
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
]

BASE_PORT_DISTRIBUTION: list[PortType] = [
    PortType.THREE_TO_ONE,
    PortType.THREE_TO_ONE,
    PortType.THREE_TO_ONE,
    PortType.THREE_TO_ONE,
    PortType.BRICK,
    PortType.LUMBER,
    PortType.WOOL,
    PortType.GRAIN,
    PortType.ORE,
]


def shuffled_resource_layout(rng: random.Random | None = None) -> list[ResourceType]:
    layout = list(BASE_RESOURCE_DISTRIBUTION)
    (rng or random).shuffle(layout)
    return layout


def coloured_resource_layout() -> list[ResourceType]:
    raw_layout = list(BASE_RESOURCE_DISTRIBUTION)
    neighbours = TILES_NEIGHBOURS.copy()
    resultant_layout = [None] * len(neighbours)

    #pintar tile aleatório de ladrão
    tile_ladrao = random.randint(0, len(raw_layout)-1)
    resultant_layout[tile_ladrao] = ResourceType.DESERT
    raw_layout.pop(raw_layout.index(ResourceType.DESERT))

    #ordenar por ordem não-crescente de graus (retirando tile ladrão da conta)
    for v, tam, neighbour_list in neighbours:
        #If the current vertex is adjacent to robber_tile, subtract 1 from its degree
        if tile_ladrao in neighbour_list:
            tam -= 1
    neighbours.sort(key=lambda x: x[1], reverse=True)

    #pintar vértices tal que nenhum adjacente seja da mesma cor que o atual
    for v, tam, neighbour_list in neighbours:
        if v == tile_ladrao:
            continue
        
        #Tries to pick a random color and checks if a neighbour already has that color
        #In the events of a yes, picks another random color
        #This might be a shitty heuristic, but it's fun and more unpredictable!
        color_not_assigned = True
        while color_not_assigned:
            random_type = random.choice(raw_layout)
            u = 0
            while u < tam:
                print(f"u{u} -- {resultant_layout[neighbour_list[u]]} -- {random_type}")
                if resultant_layout[neighbour_list[u]] == random_type:
                    print("DEU MERDA")
                    #Returns to the beginning of the list if chosen color matches a neighbour color and tries another one
                    random_type = random.choice(raw_layout)
                    u = 0
                else:
                    u+=1
            #If able to reach end of neighbour list, the color can be assigned
            #Remove that color from raw layout so it can't be chosen again
            raw_layout.pop(raw_layout.index(random_type))
            color_not_assigned = False
        resultant_layout[v] = random_type

    return resultant_layout


def shuffled_token_layout(rng: random.Random | None = None) -> list[int]:
    layout = list(BASE_NUMBER_TOKENS)
    (rng or random).shuffle(layout)
    return layout


def shuffled_port_layout(rng: random.Random | None = None) -> list[PortType]:
    layout = list(BASE_PORT_DISTRIBUTION)
    (rng or random).shuffle(layout)
    return layout


def port_ratio(port_type: PortType) -> int:
    return 3 if port_type == PortType.THREE_TO_ONE else 2
