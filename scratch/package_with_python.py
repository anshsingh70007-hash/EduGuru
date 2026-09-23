import os
import zipfile

src_dir = r"C:\Users\Harmeet Singh\Downloads\educationistguru_production_package"
zip_path = r"C:\Users\Harmeet Singh\Downloads\educationistguru_production_package.zip"
doc_zip_path = r"C:\Users\Harmeet Singh\Documents\educationistguru_production_package.zip"

print(f"Packaging from: {src_dir}")

for out_path in [zip_path, doc_zip_path]:
    if os.path.exists(out_path):
        os.remove(out_path)
    with zipfile.ZipFile(out_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(src_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, src_dir)
                # Ensure 100% standard POSIX forward slashes for Linux/LiteSpeed extraction
                arcname = rel_path.replace('\\', '/')
                z.write(full_path, arcname)
    print(f"SUCCESS: Created clean POSIX ZIP archive at: {out_path} ({os.path.getsize(out_path) / (1024*1024):.2f} MB)")
