# -*- coding: utf-8 -*-
# SPDX-License-Identifier: MIT

"""
simplifier.py
This file contains functions that requests a certain API for long text simplifying.

Author: Jaxon Ma
Date: 2026-07-10
"""

import os

from dotenv import load_dotenv
from openai import OpenAI


def get_env_settings() -> dict:
    """Loads environment variables from a .env file.

    Returns:
        dict: A dictionary containing the environment variables, including base_url, api_key, and model.
    """
    load_dotenv()
    base_url = os.getenv("BASE_URL", "URL_TO_API")
    api_key = os.getenv("API_KEY", "YOUR_API_KEY")
    model = os.getenv("MODEL", "MODEL_NAME")

    return {"base_url": base_url, "api_key": api_key, "model": model}


def get_prompt(prompt_path: str="prompt.md") -> str:
    """Retrieves the prompt for text simplification from a file.

    Returns:
        str: The prompt for text simplification.
    """
    with open(prompt_path, "r") as file:
        return file.read()
    raise FileNotFoundError(f"Prompt not found in {prompt_path}.")


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
                {"role": "user", "content": text},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error simplifying text: {e}")
        return None


def main():
    with open("sample.txt", "r") as file:
        text = file.read()
    env_settings = get_env_settings()
    client = OpenAI(api_key=env_settings["api_key"], base_url=env_settings["base_url"])
    simplified_text = simplify(client, env_settings["model"], text)

    if simplified_text:
        print("Simplified Text:")
        print(simplified_text)


if __name__ == "__main__":
    main()
