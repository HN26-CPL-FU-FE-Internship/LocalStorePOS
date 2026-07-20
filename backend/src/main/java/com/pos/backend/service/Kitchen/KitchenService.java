package com.pos.backend.service.Kitchen;


import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.repository.OrderRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class KitchenService {
    
    OrderRepository orderRepository;

    public Map<String, Long> getKitchenStats(){
        
        Map<String, Long> result = new LinkedHashMap<>();
        for(KitchenStatus status: KitchenStatus.values()){
            result.put(status.name(), 0L);
        }

        List<KitchenStatusCount> stats = orderRepository.countOrderByKitchenStatus();

        for(KitchenStatusCount statusCount: stats){
            result.put(statusCount.getKitchenStatus(), statusCount.getTotalOrder());
        }
        
        return result;
    }
}
