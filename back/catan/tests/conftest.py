from __future__ import annotations

import ast
import html
import re
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


REPORT_DIR = Path(__file__).resolve().parents[2] / "test-reports"
_RESULTS: list["TestResult"] = []
_ASSERTIONS: dict[str, list[str]] = {}


@dataclass
class TestResult:
    nodeid: str
    module: str
    test_name: str
    status: str
    duration: float
    expected: str
    accepted_range: str
    obtained: str


TEST_CATALOG: dict[str, tuple[str, str]] = {
    "test_standard_topology_sizes": (
        "O tabuleiro padrao deve ter os totais esperados de componentes.",
        "tiles = 19; vertices = 54; edges = 72; ports = 9.",
    ),
    "test_vertex_invariants": (
        "Cada vertice deve respeitar os limites de adjacencia da topologia.",
        "vertices adjacentes entre 2 e 3; arestas incidentes entre 2 e 3; tiles adjacentes entre 1 e 3.",
    ),
    "test_edge_invariants": (
        "Cada aresta deve ligar dois vertices distintos e pertencer a 1 ou 2 tiles.",
        "v1 != v2; tiles adjacentes entre 1 e 2.",
    ),
    "test_tile_invariants": (
        "Cada tile deve possuir exatamente seis vertices e seis arestas.",
        "len(vertex_ids) = 6; len(edge_ids) = 6.",
    ),
    "test_roll_records_individual_dice_values": (
        "A rolagem deve registrar dois dados individuais e soma compativel.",
        "cada dado entre 1 e 6; soma dos dados igual ao valor rolado.",
    ),
    "test_roll_7_requires_discard_and_robber_move": (
        "Uma rolagem 7 deve exigir descarte dos jogadores com mais de 7 recursos e movimento do ladrao.",
        "rolagem = 7; jogador com 8 recursos descarta 4; robber_move_required verdadeiro ate mover o ladrao.",
    ),
    "test_longest_road_on_straight_chain": (
        "A maior estrada em uma cadeia reta deve contar todo o caminho continuo.",
        "comprimento aceito = 4.",
    ),
    "test_longest_road_on_branch_uses_best_path": (
        "A maior estrada com ramificacao deve usar o melhor caminho sem contar ramificacoes extras indevidamente.",
        "comprimento aceito = 4.",
    ),
    "test_enemy_building_blocks_through_vertex": (
        "Construcao inimiga no vertice deve bloquear a continuidade da estrada.",
        "comprimento aceito = 2.",
    ),
    "test_settlement_produces_one_resource": (
        "Assentamento deve produzir um recurso quando o numero do tile e rolado.",
        "producao aceita = 1 recurso para o jogador dono.",
    ),
    "test_city_produces_two_resources": (
        "Cidade deve produzir dois recursos quando o numero do tile e rolado.",
        "producao aceita = 2 recursos para o jogador dono.",
    ),
    "test_robber_blocks_production_on_tile": (
        "O ladrao deve bloquear a producao do tile onde esta.",
        "producao aceita = dicionario vazio.",
    ),
}


MODULE_EXPECTATIONS: dict[str, tuple[str, str]] = {
    "test_api_endpoints.py": (
        "Endpoints HTTP e WebSocket devem respeitar o contrato publico do jogo.",
        "status HTTP esperado conforme caso: 200 para sucesso, 400/401/404 para rejeicoes previstas; respostas JSON devem conter os campos assertados.",
    ),
    "test_lobby_endpoints.py": (
        "Endpoints e WebSocket de lobby devem manter estado consistente da sala.",
        "status HTTP e codigos WS esperados conforme caso; sala deve refletir jogadores, host, ready e game_id corretamente.",
    ),
    "test_lobby.py": (
        "As regras internas de lobby devem aceitar fluxos validos e rejeitar entradas invalidas.",
        "cores permitidas: red, blue, white, orange; tamanho maximo da sala; host e ready conforme asserts.",
    ),
    "test_game_flow.py": (
        "O fluxo central do jogo deve respeitar fases, turnos, descartes, trocas, saida e retorno de jogadores.",
        "fase, jogador atual, recursos, flags e excecoes devem bater exatamente com os asserts de cada caso.",
    ),
    "test_development_card_api_actions.py": (
        "Cartas de desenvolvimento via API devem aplicar efeitos atomicos e preservar informacoes privadas.",
        "comandos validos aceitos; falhas sem efeitos parciais; pontuacao publica/privada conforme asserts.",
    ),
    "test_road_rules.py": (
        "Regras de estrada devem permitir apenas posicionamentos validos.",
        "resultado booleano exato conforme conectividade, setup e bloqueio por adversario.",
    ),
    "test_settlement_rules.py": (
        "Regras de assentamento e cidade devem respeitar distancia, conexao e propriedade.",
        "resultado booleano exato conforme regra testada.",
    ),
    "test_board_topology.py": (
        "A topologia padrao do tabuleiro deve ter estrutura consistente.",
        "contagens e invariantes devem bater exatamente com os asserts.",
    ),
    "test_resource_production.py": (
        "Distribuicao de recursos deve seguir construcao, dado e bloqueio do ladrao.",
        "quantidades exatas de recursos conforme asserts.",
    ),
    "test_longest_road.py": (
        "Calculo de maior estrada deve contar caminhos validos e bloqueios.",
        "comprimento numerico exato conforme assert do caso.",
    ),
}


def pytest_configure(config: Any) -> None:
    _RESULTS.clear()
    _ASSERTIONS.clear()
    _ASSERTIONS.update(_load_assertions())


def pytest_runtest_logreport(report: Any) -> None:
    if report.when != "call":
        return

    module, test_name = _split_nodeid(report.nodeid)
    expected, accepted_range = _describe_case(module, test_name)
    assertions = _assertions_for_nodeid(report.nodeid, module, test_name)
    if assertions:
        accepted_range = accepted_range + "\n\nCriterios assertados no teste:\n" + "\n".join(
            f"- {assertion}" for assertion in assertions
        )

    if report.passed:
        status = "PASSOU"
        obtained = (
            "Os valores obtidos durante a execucao satisfizeram todos os criterios aceitos "
            "e asserts listados para este teste."
        )
    elif report.skipped:
        status = "PULADO"
        obtained = _clean_text(str(report.longrepr))
    else:
        status = "FALHOU"
        obtained = _clean_text(report.longreprtext)

    _RESULTS.append(
        TestResult(
            nodeid=report.nodeid,
            module=module,
            test_name=test_name,
            status=status,
            duration=report.duration,
            expected=expected,
            accepted_range=accepted_range,
            obtained=obtained,
        )
    )


def pytest_sessionfinish(session: Any, exitstatus: int) -> None:
    if not _RESULTS:
        return

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    markdown = _build_markdown(_RESULTS, generated_at, exitstatus)
    markdown_path = REPORT_DIR / "resultado-testes.md"
    docx_path = REPORT_DIR / "resultado-testes.docx"
    markdown_path.write_text(markdown, encoding="utf-8")
    _write_docx(docx_path, markdown)


def _split_nodeid(nodeid: str) -> tuple[str, str]:
    parts = nodeid.split("::")
    module = Path(parts[0]).name
    test_name = parts[-1]
    return module, test_name


def _describe_case(module: str, test_name: str) -> tuple[str, str]:
    if test_name in TEST_CATALOG:
        return TEST_CATALOG[test_name]

    module_expected, module_range = MODULE_EXPECTATIONS.get(
        module,
        (
            "O comportamento observado deve atender aos asserts definidos no teste.",
            "Faixa aceita definida pelas expressoes assertadas no proprio teste.",
        ),
    )
    readable_name = _humanize_test_name(test_name)
    return f"{module_expected} Caso especifico: {readable_name}.", module_range


def _humanize_test_name(test_name: str) -> str:
    name = test_name.removeprefix("test_")
    return name.replace("_", " ")


def _load_assertions() -> dict[str, list[str]]:
    assertions: dict[str, list[str]] = {}
    tests_dir = Path(__file__).resolve().parent
    for path in sorted(tests_dir.glob("test_*.py")):
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name.startswith("test_"):
                extracted = _assertions_for_function(node)
                assertions[f"catan/tests/{path.name}::{node.name}"] = extracted
                assertions[f"back/catan/tests/{path.name}::{node.name}"] = extracted
    return assertions


def _assertions_for_nodeid(nodeid: str, module: str, test_name: str) -> list[str]:
    if nodeid in _ASSERTIONS:
        return _ASSERTIONS[nodeid]

    suffix = f"{module}::{test_name}"
    for key, value in _ASSERTIONS.items():
        if key.endswith(suffix):
            return value
    return []


def _assertions_for_function(function: ast.FunctionDef) -> list[str]:
    expressions: list[str] = []
    for node in ast.walk(function):
        if isinstance(node, ast.Assert):
            expressions.append(ast.unparse(node.test))
        elif isinstance(node, ast.With):
            expressions.extend(_pytest_raises_expressions(node))
    return expressions


def _pytest_raises_expressions(node: ast.With) -> list[str]:
    expressions: list[str] = []
    for item in node.items:
        context_expr = item.context_expr
        if (
            isinstance(context_expr, ast.Call)
            and isinstance(context_expr.func, ast.Attribute)
            and context_expr.func.attr == "raises"
        ):
            expressions.append(ast.unparse(context_expr))
    return expressions


def _clean_text(value: str) -> str:
    value = re.sub(r"\x1b\[[0-9;]*m", "", value)
    return value.strip()


def _build_markdown(
    results: list[TestResult], generated_at: str, exitstatus: int
) -> str:
    total = len(results)
    passed = sum(1 for result in results if result.status == "PASSOU")
    failed = sum(1 for result in results if result.status == "FALHOU")
    skipped = sum(1 for result in results if result.status == "PULADO")

    lines = [
        "# Relatorio de Resultados dos Testes - OpenCatan",
        "",
        f"Gerado em: {generated_at}",
        f"Codigo de saida do pytest: {exitstatus}",
        "",
        "## Resumo",
        "",
        f"- Total: {total}",
        f"- Passaram: {passed}",
        f"- Falharam: {failed}",
        f"- Pulados: {skipped}",
        "",
        "## Casos Executados",
        "",
    ]

    for index, result in enumerate(results, start=1):
        lines.extend(
            [
                f"### {index}. {result.test_name}",
                "",
                f"- Arquivo: `{result.module}`",
                f"- Node id: `{result.nodeid}`",
                f"- Status: **{result.status}**",
                f"- Duracao: {result.duration:.4f}s",
                "",
                "**Resultado esperado**",
                "",
                result.expected,
                "",
                "**Faixa de valores / criterios aceitos**",
                "",
                result.accepted_range,
                "",
                "**Resultado obtido**",
                "",
                _as_code_block_if_needed(result.obtained),
                "",
            ]
        )
    return "\n".join(lines)


def _as_code_block_if_needed(value: str) -> str:
    if "\n" not in value and len(value) < 120:
        return value
    return "```text\n" + value + "\n```"


def _write_docx(path: Path, markdown: str) -> None:
    paragraphs = _markdown_to_plain_paragraphs(markdown)
    document_xml = _document_xml(paragraphs)

    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as docx:
        docx.writestr("[Content_Types].xml", _content_types_xml())
        docx.writestr("_rels/.rels", _rels_xml())
        docx.writestr("word/document.xml", document_xml)
        docx.writestr("word/_rels/document.xml.rels", _document_rels_xml())


def _markdown_to_plain_paragraphs(markdown: str) -> list[str]:
    paragraphs: list[str] = []
    in_code_block = False
    for line in markdown.splitlines():
        if line.startswith("```"):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            paragraphs.append(line)
            continue
        line = re.sub(r"^#{1,6}\s*", "", line)
        line = line.replace("**", "")
        line = line.replace("`", "")
        paragraphs.append(line)
    return paragraphs


def _document_xml(paragraphs: list[str]) -> str:
    body = "\n".join(_paragraph_xml(paragraph) for paragraph in paragraphs)
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{body}<w:sectPr><w:pgSz w:w=\"12240\" w:h=\"15840\"/>"
        '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" '
        'w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>'
    )


def _paragraph_xml(text: str) -> str:
    escaped = html.escape(text, quote=False)
    return f"<w:p><w:r><w:t xml:space=\"preserve\">{escaped}</w:t></w:r></w:p>"


def _content_types_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        "</Types>"
    )


def _rels_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
        'Target="word/document.xml"/>'
        "</Relationships>"
    )


def _document_rels_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'
    )
