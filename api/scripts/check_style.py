import ast
import io
import re
import sys
import tokenize
from pathlib import Path

_API_ROOT = Path(__file__).resolve().parent.parent
_SKIPPED_DIRECTORY_NAMES = frozenset({".venv", "__pycache__"})
_COMMENT_PREFIXES = ("NOTE", "TODO", "noqa", "type:", "pyright:", "ruff:", "fmt:")
_ENUM_BASE_NAMES = frozenset({"StrEnum", "Enum"})
_VALID_ERROR_NAME_PATTERN = re.compile(
    r"^(error|unexpected_failure|error_to_[a-z_]+|[a-z]+_error)$"
)
_FUNCTION_NODE_TYPES = (ast.FunctionDef, ast.AsyncFunctionDef)
# NOTE: pytest wraps a pytestmark that is not a list as one mark, so a tuple breaks collection
_LIST_CONSTANT_NAMES_ALLOWED = frozenset({"pytestmark"})
# NOTE: 28 test fakes close over their test's locals; accepted under R38 on 2026-11-24
_NESTED_DEF_DIRECTORY_ALLOWED = "tests"


def _get_base_name(base: ast.expr) -> str:
    if isinstance(base, ast.Attribute):
        return base.attr
    if isinstance(base, ast.Name):
        return base.id
    return ""


def _get_enum_member_lines(tree: ast.Module) -> frozenset[int]:
    member_lines: set[int] = set()
    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue
        if not any(_get_base_name(base) in _ENUM_BASE_NAMES for base in node.bases):
            continue
        for statement in node.body:
            if isinstance(statement, ast.Assign | ast.AnnAssign):
                member_lines.update(
                    range(
                        statement.lineno, (statement.end_lineno or statement.lineno) + 1
                    )
                )
    return frozenset(member_lines)


def _is_licensed_comment(text: str, line: int) -> bool:
    body = text.removeprefix("#").lstrip()
    if body.startswith(_COMMENT_PREFIXES):
        return True
    return line == 1 and text.startswith("#!")


def _check_comments(source: str, tree: ast.Module) -> list[tuple[int, str]]:
    enum_member_lines = _get_enum_member_lines(tree)
    findings: list[tuple[int, str]] = []
    for token in tokenize.generate_tokens(io.StringIO(source).readline):
        if token.type != tokenize.COMMENT:
            continue
        line = token.start[0]
        is_inline = token.line[: token.start[1]].strip() != ""
        if is_inline and line in enum_member_lines:
            continue
        if _is_licensed_comment(token.string, line):
            continue
        findings.append(
            (
                line,
                "comments: comment is not NOTE, TODO or a tool pragma"
                " (API-D01, R25, R36)",
            )
        )
    return findings


def _is_list_value(value: ast.expr | None) -> bool:
    if isinstance(value, ast.List):
        return True
    return (
        isinstance(value, ast.Call)
        and isinstance(value.func, ast.Name)
        and value.func.id == "list"
    )


def _is_allowed_list_constant(statement: ast.Assign | ast.AnnAssign) -> bool:
    targets = (
        statement.targets if isinstance(statement, ast.Assign) else [statement.target]
    )
    return any(
        isinstance(target, ast.Name) and target.id in _LIST_CONSTANT_NAMES_ALLOWED
        for target in targets
    )


def _check_list_constants(tree: ast.Module) -> list[tuple[int, str]]:
    return [
        (
            statement.lineno,
            "list-constant: module-level constant is a list, use a tuple (API-T07)",
        )
        for statement in tree.body
        if isinstance(statement, ast.Assign | ast.AnnAssign)
        and _is_list_value(statement.value)
        and not _is_allowed_list_constant(statement)
    ]


def _check_handlers(tree: ast.Module) -> list[tuple[int, str]]:
    findings: list[tuple[int, str]] = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.ExceptHandler):
            continue
        if node.name is not None and not _VALID_ERROR_NAME_PATTERN.match(node.name):
            findings.append(
                (
                    node.lineno,
                    f"except-name: '{node.name}' is not error, unexpected_failure,"
                    " error_to_<verb> or <noun>_error (API-N11, R45)",
                )
            )
        if isinstance(node.type, ast.Tuple):
            findings.append(
                (
                    node.lineno,
                    "except-tuple: one handler per exception type (API-C06)",
                )
            )
    return findings


def _find_nested_functions(
    node: ast.AST, enclosing_name: str | None
) -> list[tuple[int, str]]:
    findings: list[tuple[int, str]] = []
    for child in ast.iter_child_nodes(node):
        if isinstance(child, ast.ClassDef):
            findings.extend(_find_nested_functions(child, None))
            continue
        if not isinstance(child, _FUNCTION_NODE_TYPES):
            findings.extend(_find_nested_functions(child, enclosing_name))
            continue
        if enclosing_name is not None:
            findings.append(
                (
                    child.lineno,
                    f"nested-def: '{child.name}' is defined inside"
                    f" '{enclosing_name}' (API-L05, R32)",
                )
            )
        findings.extend(_find_nested_functions(child, child.name))
    return findings


def _check_nested_functions(tree: ast.Module) -> list[tuple[int, str]]:
    return _find_nested_functions(tree, None)


def _check_file(path: Path) -> list[str]:
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source)
    relative_path = path.relative_to(_API_ROOT).as_posix()
    findings = [
        *_check_comments(source, tree),
        *_check_list_constants(tree),
        *_check_handlers(tree),
    ]
    if path.relative_to(_API_ROOT).parts[0] != _NESTED_DEF_DIRECTORY_ALLOWED:
        findings.extend(_check_nested_functions(tree))
    return [f"{relative_path}:{line}: {message}" for line, message in sorted(findings)]


def main() -> int:
    lines: list[str] = []
    for path in sorted(_API_ROOT.rglob("*.py")):
        if _SKIPPED_DIRECTORY_NAMES.intersection(path.parts):
            continue
        lines.extend(_check_file(path))
    if not lines:
        sys.stdout.write("check_style: no findings\n")
        return 0
    sys.stdout.write("\n".join(lines) + "\n")
    return 1


if __name__ == "__main__":
    sys.exit(main())
