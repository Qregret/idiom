# -*- coding: utf-8 -*-
"""Export idioms from MySQL into the Vue app data file."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pymysql


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="导出成语数据到 Vue 前端")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=3306)
    parser.add_argument("--database", default="idiom")
    parser.add_argument("--user", default="root")
    parser.add_argument("--password", default="root")
    parser.add_argument("--output", default="src/data/idioms.json")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    conn = pymysql.connect(
        host=args.host,
        port=args.port,
        user=args.user,
        password=args.password,
        database=args.database,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )
    with conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    word,
                    explanation,
                    frequency,
                    exact_frequency,
                    min_frequency,
                    reliability_level,
                    confidence,
                    occurrence_count,
                    source_site_count,
                    priority_score,
                    frequency_basis,
                    source_urls
                FROM public_exam_high_frequency_idioms_study_priority
                """
            )
            rows = cursor.fetchall()

    data = []
    for index, row in enumerate(rows, start=1):
        data.append(
            {
                "id": index,
                "word": row["word"],
                "explanation": row["explanation"] or "",
                "frequency": int(row["frequency"] or 0),
                "exactFrequency": row["exact_frequency"],
                "minFrequency": int(row["min_frequency"] or 0),
                "reliabilityLevel": row["reliability_level"],
                "confidence": float(row["confidence"] or 0),
                "occurrenceCount": int(row["occurrence_count"] or 0),
                "sourceSiteCount": int(row["source_site_count"] or 0),
                "priorityScore": float(row["priority_score"] or 0),
                "frequencyBasis": row["frequency_basis"] or "",
                "sourceUrls": [
                    item.strip()
                    for item in (row["source_urls"] or "").splitlines()
                    if item.strip()
                ],
            }
        )

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"导出 {len(data)} 条到 {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
