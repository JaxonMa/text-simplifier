# -*- coding: utf-8 -*-
# SPDX-License-Identifier: MIT

"""
simplifier.py
This file contains functions that requests a certain API for long text simplifying.

Author: Jaxon Ma
Date: 2026-07-10
"""

from openai import OpenAI
from dotenv import load_dotenv
import os


def get_env_settings() -> dict:
    """Loads environment variables from a .env file.

    Returns:
        dict: A dictionary containing the environment variables, including base_url, api_key, model, and is_loop_enabled.
    """
    load_dotenv()
    base_url = os.getenv("BASE_URL", "URL_TO_API")
    api_key = os.getenv("API_KEY", "YOUR_API_KEY")
    model = os.getenv("MODEL", "MODEL_NAME")
    loop = os.getenv("LOOP", "True").lower() == "true"

    return {
        "base_url": base_url,
        "api_key": api_key,
        "model": model,
        "is_loop_enabled": loop
    }


def get_prompt() -> str:
    """Retrieves the prompt for text simplification from a file.
    
    Returns:
        str: The prompt for text simplification.
    """
    with open("prompt.md", "r") as file:
        return file.read()
    return "Please simplify the following text while maintaining its original meaning and context. " \
            + "Ensure that the simplified version is clear, concise, and easy to understand. " \
            + "Use the language user's input is in, and avoid changing the tone or style of the text. "


def simplify(client: OpenAI, model: str, text: str) -> str | None:
    """Simplifies the given text using the OpenAI API.

    Args:
        client (OpenAI): The OpenAI client.
        model (str): The model to use for simplification.
        text (str): The text to be simplified.

    Returns:
        str | None: The simplified text if successful, None otherwise.
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": get_prompt()},
                {"role": "user", "content": text}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error simplifying text: {e}")
        return None


def main():
    with open("sample_text.txt", "r") as file:
        text = file.read()
    env_settings = get_env_settings()
    client = OpenAI(api_key=env_settings["api_key"], base_url=env_settings["base_url"])
    simplified_text = simplify(client, env_settings["model"], text)

    if simplified_text:
        print("Simplified Text:")
        print(simplified_text)
        

if __name__ == "__main__":
    main()
