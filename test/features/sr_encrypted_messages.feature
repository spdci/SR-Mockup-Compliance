@data
Feature: Encrypted SR messages (EncryptedMessage)

When header.is_msg_encrypted is true the message is not an SR payload but an
EncryptedMessage (JWE-like: header, ciphertext, encrypted_key, tag, iv). The suite
checks that every part of it is present. Runs offline.

  Scenario Outline: An encrypted "<action>" message must be a complete EncryptedMessage
    Given an encrypted "<action>" message
    Then the encrypted message should be valid

    Examples:
      | action        |
      | on-search     |
      | notify        |
      | txn-on-status |

  Scenario Outline: An encrypted message missing "<field>" is rejected
    Given an encrypted "on-search" message
    When its encrypted field "<field>" is removed
    Then the encrypted message should be rejected because of "<error>"

    Examples:
      | field         | error                                             |
      | ciphertext    | must have required property 'ciphertext'          |
      | encrypted_key | must have required property 'encrypted_key'       |
      | tag           | must have required property 'tag'                 |
      | iv            | must have required property 'iv'                  |
      | header        | /message must have required property 'header'     |
      | header.kid    | /message/header must have required property 'kid' |
