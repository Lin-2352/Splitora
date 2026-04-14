from PIL import Image
from pathlib import Path
 

def convert_webp_to_jpg():
    # Move up from app/services → project root
    BASE_DIR = Path(__file__).resolve().parents[2]
    input_folder = BASE_DIR / "sample_bills"

    if not input_folder.exists():
        print("sample_bills folder not found.")
        return

    converted_count = 0

    for file in input_folder.iterdir():
        if file.suffix.lower() == ".webp":
            output_path = file.with_suffix(".jpg")

            try:
                # Convert
                img = Image.open(file)
                img = img.convert("RGB")
                img.save(output_path, "JPEG", quality=95)

                # Delete original .webp ONLY after successful save
                file.unlink()

                print(f"Converted & Removed: {file.name}")
                converted_count += 1

            except Exception as e:
                print(f"Failed to convert {file.name}: {e}")

    print(f"\nDone! Converted and removed {converted_count} file(s).")


if __name__ == "__main__":
    convert_webp_to_jpg()