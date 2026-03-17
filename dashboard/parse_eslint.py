import json

try:
    with open('eslint_report.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    for file in data:
        if len(file['messages']) > 0:
            print(f"\n--- {file['filePath']} ---")
            for msg in file['messages']:
                print(f"Line {msg['line']}: {msg['message']} ({msg.get('ruleId', 'N/A')})")
except Exception as e:
    print("Error parsing", e)
