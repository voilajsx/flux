#!/bin/bash

ENV_FILE=${1:-.env}

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file '$ENV_FILE' not found."
  exit 1
fi

secrets=""

while IFS= read -r line || [ -n "$line" ]; do
  if [[ "$line" =~ ^#.*$ || -z "$line" ]]; then
    continue
  fi

  IFS='=' read -r key value <<< "$line"
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')
  secrets="$secrets $key=\"$value\""
done < "$ENV_FILE"

eval flyctl secrets set $secrets