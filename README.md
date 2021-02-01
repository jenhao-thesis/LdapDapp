# Blockchain-based identity management and access control with LDAP

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

node ldapServer.js
ldapadd -H ldap://localhost:1389 -D "cn=root" -w secret -f qwer.ldif
ldapsearch -H ldap://localhost:1389 -x -D "cn=root" -w "secret" -b "ou=location2,dc=jenhao,dc=com"

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

## Tools

* [Truffle v5.1.57](https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-solidity)
* [Solidity v0.5.16](https://docs.soliditylang.org/en/v0.5.16/genindex.html)
* [Node v14.15.1](https://nodejs.org/en/)
* [Web3.js v1.3.0](https://github.com/ChainSafe/web3.js?source=post_page-----70de1c0c035c----------------------)
* [Express 4.9.0](https://www.npmjs.com/package/express/v/4.9.0)