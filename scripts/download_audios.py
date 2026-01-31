import json
import os
import requests
import hashlib
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent
INPUT_JSON = BASE_DIR / "impostoraudiosoriginal.json"
OUTPUT_DIR = BASE_DIR / "public" / "imposter_audio"
OUTPUT_JSON = BASE_DIR / "public" / "imposter_audios.json"

def get_filename(url):
    # Extract filename from URL or generate a hash if it's messy
    clean_name = url.split('/')[-1].split('?')[0]
    if not clean_name.endswith(('.ogg', '.mp3', '.wav')):
        # Fallback to hash if filename is not clear
        clean_name = hashlib.md5(url.encode()).hexdigest() + ".ogg"
    return clean_name

def download_file(url, dest_path):
    if dest_path.exists():
        print(f"Skipping (already exists): {dest_path.name}")
        return True
    
    try:
        print(f"Downloading: {url}")
        response = requests.get(url, stream=True, timeout=10)
        response.raise_for_status()
        with open(dest_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

def main():
    # Create output directory if it doesn't exist
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(INPUT_JSON, 'r') as f:
        data = json.load(f)

    new_data = {}

    for category, items in data.items():
        new_data[category] = []
        print(f"\nProcessing category: {category}")
        
        for item in items:
            new_item = {
                "text": item["text"],
                "mirrors": []
            }
            
            # Download main URL
            filename = get_filename(item["url"])
            dest_path = OUTPUT_DIR / filename
            if download_file(item["url"], dest_path):
                new_item["url"] = f"/imposter_audio/{filename}"
            else:
                new_item["url"] = item["url"] # Fallback to remote if download fails

            # Download mirrors
            for mirror in item.get("mirrors", []):
                m_filename = get_filename(mirror["url"])
                m_dest_path = OUTPUT_DIR / m_filename
                if download_file(mirror["url"], m_dest_path):
                    new_item["mirrors"].append({
                        "url": f"/imposter_audio/{m_filename}",
                        "text": mirror["text"]
                    })
                else:
                    new_item["mirrors"].append(mirror) # Fallback

            new_data[category].append(new_item)

    # Save the new JSON
    with open(OUTPUT_JSON, 'w') as f:
        json.dump(new_data, f, indent=4)
    
    print(f"\nFinished! Local JSON saved to {OUTPUT_JSON}")
    print(f"Audios downloaded to {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
