package com.pos.backend.service.Table;

import java.util.List;

import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.request.Table.RestaurantTableRequest;
import com.pos.backend.dto.response.Table.RestaurantTableResponse;

public interface RestaurantTableService {

    List<RestaurantTableResponse> getTables(Long areaId, TableStatus status);

    RestaurantTableResponse createTable(RestaurantTableRequest request);

    RestaurantTableResponse updateTable(Long id, RestaurantTableRequest request);

    RestaurantTableResponse updateStatus(Long id, TableStatus status);

    void deleteTable(Long id);
}
