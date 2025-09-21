---
title: Backup Restore
tags: []
relates_to: []
---

**Context**: 
Currently, while under development, there's no backup at all.
moreover, the docker stack is reset including removing the postgres volume.

start.sh and test.sh init database and test data every fresh start.

The frontend is stateless, so eventually the postgres database needs to be backed up.