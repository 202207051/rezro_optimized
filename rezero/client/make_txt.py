import os

output_path = "/home/user1/codePrint.txt"

# 상위 디렉터리가 없으면 자동으로 생성
os.makedirs(os.path.dirname(output_path), exist_ok=True)

if os.path.exists(output_path):
    os.remove(output_path)

with open(output_path, "w", encoding="utf-8") as outfile:
    for item in sorted(os.listdir(".")):
        if os.path.isdir(item) and item != "api":
            for root, dirs, files in os.walk(item):
                for file in files:
                    file_path = os.path.join(root, file).replace("\\", "/")
                    outfile.write(f"// src/{file_path}\n\n")
                    try:
                        with open(os.path.join(root, file), "r", encoding="utf-8", errors="ignore") as f:
                            outfile.write(f.read())
                    except Exception as e:
                        outfile.write(f"[Error reading file: {e}]\n")
                    outfile.write("\n\n\n")

print(f"생성 완료: {output_path}")
