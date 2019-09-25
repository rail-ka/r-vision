Console SSH client

Необходимо создать консольную утилиту, которая будет представлять собой полноценный ssh-клиент, то есть утилита должна транслировать команды вводимые пользователем на удаленную систему и получать результат их выполнения. 

Дополнительно нужно реализовать собственную команду `get <filename>` при вводе которой, утилита будет скачивать с удаленного сервера указанный файл.

```
MacBook-Pro-Nikolaj:ssh-test dos$ node ssh.js root:pxtm0222@10.8.0.22
[18:29:12] Connecting to 10.8.0.22...
[18:29:15] Connection successful.
Last login: Sun Nov 13 23:03:01 2016 from 10.8.0.18
root@mainsrv:~# cd /etc
root@mainsrv:/etc# ls | grep deb
debconf.conf
debian_version
root@mainsrv:/etc# get debian_version
[18:29:44] Downloading 10.8.0.22:/etc/debian_version from to 127.0.0.1:/Users/dos/www/ssh-test/
[18:29:46] File is downloaded successfully
root@mainsrv:/etc# exit
MacBook-Pro-Nikolaj:ssh-test dos$ ls
debian_version  node_modules    npm-debug.log   package.json    ssh.js
MacBook-Pro-Nikolaj:ssh-test dos$ cat debian_version
jessie/sid
MacBook-Pro-Nikolaj:ssh-test dos$
```

Дополнительная часть, чтобы определить ваш уровень:

- [x] Реализовать отправку файлов на удаленный сервер (команда put /path/to/localfile)
2. Реализовать возможность автодополнения по нажатию Tab, как в нативном SSH клиенте
3. Реализовать корректную обработку комбинации клавиш Ctrl+C для выхода из программы внутри ssh-сессии, например когда запущена команда top
- [x] SSH клиент должен уметь пробрасывать порты на локальную машину (то есть создавать полноценные SSH-тунели `[-L [bind_address:]port:host:hostport]`).
- [x] SSH клиент должен уметь пробрасывать порты на удаленную машину `[-R [bind_address:]port:host:hostport]`
6. Покрыть написанный код тестами.

## TODO

- при удалении строки, удаляется префикс ssh - предложение к вводу команд
- top / down keypress don't work
- 'Connection successful.' - отображается, когда ssh еще не подключился

## Полезные ссылки

https://github.com/mscdex/ssh2
https://github.com/mscdex/ssh2-streams
https://github.com/Stocard/node-ssh-forward
