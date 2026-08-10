package com.pos.backend.service.Table;

import java.util.List;

import com.pos.backend.dto.request.TableFloor.TableFloorRequest;
import com.pos.backend.dto.response.Common.OptionResponse;

public interface TableFloorService {

    List<OptionResponse> getFloors();

    OptionResponse createFloor(TableFloorRequest request);

    void deleteFloor(Long id);
}
