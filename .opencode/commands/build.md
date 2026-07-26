---
description: Собрать .zab-файл календаря через npm run build
agent: explore
subtask: true
---

Запустить `npm run build` в директории `C:\_Soft\_ZepOS\calendar\src`. Использовать команду PowerShell: `cmd /c "cd /d C:\_Soft\_ZepOS\calendar\src && npm run build"`. Дождаться завершения и сообщить результат (версия обновлена, успех/ошибка). Больше ничего не делать.

Извлеки из файла (это zip-архив) файл с расширением zpk и сохрани его в директории `C:\_Soft\_ZepOS\calendar\docs\versions` с именем `calendar_{версия}.zpk`.

Отредактируй файл `C:\_Soft\_ZepOS\calendar\docs\versions.html`. Добавь строку с новой версией в начало существующего списка версий по аналогии с другими версиями.