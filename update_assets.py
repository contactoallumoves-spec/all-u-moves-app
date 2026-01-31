
import base64
import os

def update_assets():
    logo_path = 'public/allumoves-logo.png'
    output_path = 'src/assets/reportAssets.ts'
    
    try:
        with open(logo_path, 'rb') as img_file:
            encoded_string = base64.b64encode(img_file.read()).decode('utf-8')
            
        content = f"export const REPORT_ASSETS = {{ logo: 'data:image/png;base64,{encoded_string}' }};\n"
        
        with open(output_path, 'w') as ts_file:
            ts_file.write(content)
            
        print(f"Successfully updated {output_path} with base64 logo.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_assets()
