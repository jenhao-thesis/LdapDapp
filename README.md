# Blockchain-based Identification and Access Control for OpenBanking Ecosystem

<!-- ABOUT THE PROJECT -->
## About The Project

[![DApp Screen Shot][dapp-screenshot]](images/homepage.png)

### Built With

* [Node v14.15.1](https://nodejs.org/en/)
* [Web3.js v1.3.0](https://github.com/ChainSafe/web3.js?source=post_page-----70de1c0c035c----------------------)
* [Express 4.9.0](https://www.npmjs.com/package/express/v/4.9.0)
* [Redis v=4.0.9](https://www.1ju.org/redis/redis-quick-guide)
* [OpenLDAP](https://www.techrepublic.com/article/how-to-install-openldap-on-ubuntu-18-04/)
* [Truffle v5.1.57](https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-solidity) or [Remix - Ethereum IDE](https://remix.ethereum.org/)
* [Solidity v0.5.16](https://docs.soliditylang.org/en/v0.5.16/genindex.html)

## Compile cotract

browserify: convert web3_init.js to web3_bundle.js
```
browserify web3_init.js -o web3_bundle.js
```
truffle: compile and deploy contract // if node -v is 8.10 it won't worked, please uprgade to v14

```
truffle init
truffle compile
truffle migrate --reset
```

## LDAP server setup

Start LDAP server
```
node ldapServer.js
```

Initial a hierarchical directory structure for user data
```
ldapadd -H ldap://localhost:1389 -D "cn=root" -w secret -f qwer.ldif
```

Search specific user
```
ldapsearch -H ldap://localhost:1389 -x -D "cn=root" -w "secret" -b "ou=location2,dc=jenhao,dc=com"
```

## Config
[server-config.json](https://github.com/jenhao-thesis/LdapDapp/blob/main/server-config-example.json)

```json
{
    "ldap": {
        "server": {
            "url": "ldap://[ip:port]",
            "bindDN": "[bindDN]",
            "bindCredentials": "[bindCredentials]",
            "searchBase": "[searchBase]",
            "searchFilter": "[searchFilter]"
          },
          "usernameField": "username",
          "passwordField": "password"
    },
    "redis": {
        "host": "[ip]",
        "port": "[port]"
    },
    "contracts": {
        "organizationManagerAddress": "[contract address]",
        "accessManagerAddress": ""
    },
    "admin_address": "[administrator address]",
    "admin_key": "[administrator private key]",
    "web3_provider": "ws://[ip:port]",
    "org_mapping": {
        "[address of organization A(upper case only)]": ["[ip:port]", "[organization name for display on website]"],
        "[address of organization B(upper case only)]": ["[ip:port]", "[organization name for display on website]"],
        "[address of organization C(upper case only)]": ["[ip:port]", "[organization name for display on website]"],
        "[address of organization D(upper case only)]": ["[ip:port]", "[organization name for display on website]"],
        "[address of organization E(upper case only)]": ["[ip:port]", "[organization name for display on website]"]
    }
}
```

## Solidity

call() or send()
call do not alter the state of the contract, send do.


## Dockerfile
```
"host": "redis",
"web3_provider": "ws://ganache:8545",
"url": "ldap://ldap_server:1389",
```
```
docker exec -it <name> ash // ctrl+p, ctrl+q then exit
docker network ls
docker network inspect
// if you use host to be Ethereum network, check network gateway.
```
### Multiple organizations: folder structure
    .
    ├── orgA
    │   ├── docker-compose.yml
    │   ├── LdapDapp                    # Pull repo from https://github.com/jenhao-thesis/LdapDapp.git
    │   │   ├── server-config.json      # Server configuration
    │   │   └── build                   # 1) truffle compile, generate contracts json file. 2) compile contracts via Remix
    │   │       └── contracts
    │   │           ├── AccessManager.json
    │   │           └── OrganizationManager.json
    │   └── LdapServer                  # Pull repo from https://github.com/jenhao-thesis/LdapServer.git
    ├── orgB
    └── orgC