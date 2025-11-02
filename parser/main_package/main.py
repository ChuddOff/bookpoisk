from core import main

if __name__ == '__main__':
    main(debug=True)


# TODO:
# 1. Save state to file (cache, element index)
# 2. Validation by local LM
# 3. Async while LM generating
# 4. Logging errors to file
# 5. Auto start model and LMStudio
# 6. Remake pars from website
# 7. Async fixes
# 8. Some optimization
# 9. Refactoring structure
# 10. CLI
# 11. Make automatically application file
# 12. Bug fixes
# 13. Release
# 14. Maybe auto start script

# [2025-10-31 03:08:07]: GENERATION: Error code: 400 - {'error': 'vk::Queue::submit: ErrorDeviceLost'}
# [2025-10-31 03:08:07]: GENERATE: Книга Нож
# [2025-10-31 03:08:07]: GENERATION: Error code: 400 - {'error': 'vk::Queue::submit: ErrorDeviceLost'}
# [2025-10-31 03:08:08]: GENERATE: Книга Голос Арчера
# [2025-10-31 03:08:08]: GENERATION: Error code: 400 - {'error': ''}
# [2025-10-31 03:08:09]: GENERATE: Книга Давай поспорим
# [2025-10-31 03:08:09]: SKIP: Книга Тёмные сказки братьев Гримм
# [2025-10-31 03:08:09]: GENERATION: Error code: 400 - {'error': ''}
# [2025-10-31 03:08:09]: GENERATE: Книга Необычайные путешествия Сатюрнена Фарандуля

# [2025-10-29 04:52:27]: GENERATION: Expecting ',' delimiter: line 6 column 192 (char 343)
# [2025-10-29 04:52:27]: GENERATE: Книга Исповедь дьявола
# [2025-10-30 15:20:09]: GENERATION: Extra data: line 9 column 1 (char 831)
# [2025-10-30 15:20:09]: GENERATE: Книга Убийство на Острове-тюрьме (#2)
