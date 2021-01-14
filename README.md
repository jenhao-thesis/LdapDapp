# Blockchain-based identity management and access control with LDAP

## Compile cotract

browserify: convert web3_init.js to web3_bundle.js
truffle: compile and deploy contract // if node -v is 8.10 it won't worked, please uprgade to v14

```
truffle init
truffle compile
truffle migrate
```

## LDAP server setup

node ldapServer.js
ldapadd -H ldap://localhost:1389 -D "cn=root" -w secret -f qwer.ldif
ldapsearch -H ldap://localhost:1389 -x -D "cn=root" -w "secret" -b "ou=location2,dc=jenhao,dc=com"

## Config
[server-config.json]
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
    "contracts": {
        "organizationManagerAddress": "[contract address]",
        "accessManagerAddress": "[contract address]"
    },
    "admin_address": "[administrator address]",
    "web3_provider": "http://[ip:port]"
}
```

## Solidity

call() or send()
call do not alter the state of the contract, send do.

