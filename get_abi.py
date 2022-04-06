#!/usr/bin/python
import argparse
import requests
import json

# <!doctype html>
# <!--[if lt IE 7 ]><html class="no-js ie ie6" lang="en"> <![endif]-->
# <!--[if IE 7 ]><html class="no-js ie ie7" lang="en"> <![endif]-->
# <!--[if IE 8 ]><html class="no-js ie ie8" lang="en"> <![endif]-->
# <!--[if (gte IE 9)|!(IE)]><!--><html class="no-js" lang="en"> <!--<![endif]-->
# ...
# Exports contract ABI in JSON
txEndpoint = "https://api-ropsten.etherscan.io/api?module=account&action=tokennfttx&address=0x5cAE1f8cA829183a237f1A795111a52D0eA50757&startblock=0&endblock=27025780&sort=asc&apikey=5SFYDINPP3K6VE7IYJI2S2G4Y74MQYZYTH"
ABI_ENDPOINT = 'https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=0x9a67dc13e28B288533c45c61A34F928A8E23A463&apikey=5SFYDINPP3K6VE7IYJI2S2G4Y74MQYZYTH'
API_key = ''
ADDRESS = ''
headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}

def __main__():
    print(txEndpoint)
    response = requests.get(txEndpoint, headers = headers)
    txByAccount = response.json()['result']
    for entry in txByAccount:
        print(entry)
        print("\n\n")

    #result = json.dumps(abi_json, indent=4, sort_keys=True)
    print(abi_json)
    open("txLogs", 'w').write(result)

if __name__ == '__main__':
    __main__()
