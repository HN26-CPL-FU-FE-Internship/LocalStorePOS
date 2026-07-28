package com.pos.backend.service.WebSocket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public <T> void sendTopic(String destination, T data) {
        destination = "/topic" + destination;
        messagingTemplate.convertAndSend(destination, data);
    }

    public <T> void sendToUser(String username, String destination, T data) {
        destination = "/queue" + destination;
        messagingTemplate.convertAndSendToUser(username, destination, data);
    }
}
