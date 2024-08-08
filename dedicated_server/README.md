## Minecraft Bedrock Dedicated Server Setup

Quick setup for your Minecraft Bedrock Dedicated Server:

1. Download Bedrock Dedicated Server files from the official Minecraft website.
2. Extract files to your chosen folder.
3. Copy `server_setup.bat` to the server folder or any parent folder.
4. Right-click `server_setup.bat` and select "Run as administrator".
5. Follow on-screen prompts.

The script will:
- Exempt Minecraft from UWP loopback restrictions
- Find your local IPv4 address
- Locate and start bedrock_server.exe

After setup, you'll see your server's IP address and port. Use these to connect in Minecraft.

Note: **Default port is 19132**.

Important: You can safely close the setup script window after the server starts running.

Troubleshooting:
- Run as administrator
- Ensure server files are correctly downloaded and extracted
- Script should be in same directory as bedrock_server.exe or a parent directory
- Check firewall settings
- Verify you have the latest Bedrock Dedicated Server files