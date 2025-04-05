import json
import sys
import pandas as pd

# Basic script to analyze news articles passed as JSON

def analyze_news(input_path, output_path):
    try:
        # Read input data
        with open(input_path, 'r', encoding='utf-8') as f:
            articles = json.load(f)

        if not isinstance(articles, list):
            raise ValueError("Input JSON must be a list of articles")

        print(f"[analyze_news.py] Read {len(articles)} articles from {input_path}")

        # Perform basic analysis (e.g., count, unique sources)
        # In a real scenario, use pandas, NLP libraries (like NLTK, spaCy - need to be added to Dockerfile), etc.
        df = pd.DataFrame(articles)
        num_articles = len(df)
        unique_sources = df['source'].nunique() if 'source' in df.columns else 0
        sources_list = df['source'].unique().tolist() if 'source' in df.columns else []

        # Prepare output data
        analysis_result = {
            "processed_articles": num_articles,
            "unique_source_count": unique_sources,
            "sources": sources_list,
            "analysis_summary": f"Processed {num_articles} articles from {unique_sources} unique sources."
            # Add more complex analysis results here
        }

        # Write output data
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analysis_result, f, indent=2)

        print(f"[analyze_news.py] Analysis complete. Results written to {output_path}")

    except Exception as e:
        print(f"[analyze_news.py] Error analyzing news: {e}", file=sys.stderr)
        # Write an error structure to the output file if possible
        error_output = {"error": str(e)}
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(error_output, f, indent=2)
        except Exception as write_err:
             print(f"[analyze_news.py] Could not write error output: {write_err}", file=sys.stderr)
        sys.exit(1) # Exit with error code

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python analyze_news.py <input_json_path> <output_json_path>", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    analyze_news(input_file, output_file) 