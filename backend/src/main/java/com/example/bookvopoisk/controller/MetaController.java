package com.example.bookvopoisk.controller;

import com.example.bookvopoisk.dto.ApiEndpointResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/meta")
public class MetaController {

    @GetMapping("/endpoints")
    public List<ApiEndpointResponse> endpoints() {
        return List.of(
                new ApiEndpointResponse("POST", "/api/auth/register", "Регистрация пользователя"),
                new ApiEndpointResponse("POST", "/api/auth/login", "Аутентификация и получение JWT"),
                new ApiEndpointResponse("GET", "/api/auth/me", "Текущий профиль пользователя"),
                new ApiEndpointResponse("POST", "/api/banking/accounts", "Открыть счёт (CHECKING/SAVINGS/DEPOSIT)"),
                new ApiEndpointResponse("GET", "/api/banking/accounts", "Список счетов текущего пользователя"),
                new ApiEndpointResponse("POST", "/api/banking/accounts/{accountId}/top-up?amount=100", "Пополнение счёта"),
                new ApiEndpointResponse("POST", "/api/banking/transfers", "Безопасный перевод (oneTimeCode=000000)"),
                new ApiEndpointResponse("POST", "/api/banking/deposits", "Открытие вклада с расчётом доходности"),
                new ApiEndpointResponse("GET", "/api/banking/deposits", "Список вкладов пользователя"),
                new ApiEndpointResponse("GET", "/api/banking/accounts/{accountId}/statement", "Выписка по счёту"),
                new ApiEndpointResponse("GET", "/api/banking/donation-funds", "Список фондов для пожертвований"),
                new ApiEndpointResponse("POST", "/api/banking/donations", "Пожертвование в выбранный фонд")
        );
    }
}
