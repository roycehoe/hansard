from sqlalchemy import literal_column

TEXT_SEARCH_CONFIGURATION = literal_column("'english'")
HEADLINE_OPTIONS = "StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15"
HIGHLIGHT_ALL_OPTIONS = "StartSel=<mark>, StopSel=</mark>, HighlightAll=true"
