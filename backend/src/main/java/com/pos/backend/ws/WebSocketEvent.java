package com.pos.backend.ws;

import com.pos.backend.constant.enums.EventType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class WebSocketEvent<T> {
    private EventType type;
    private T data;
}