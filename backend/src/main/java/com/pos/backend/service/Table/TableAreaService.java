package com.pos.backend.service.Table;

import java.util.List;

import com.pos.backend.dto.request.TableArea.TableAreaRequest;
import com.pos.backend.dto.response.Common.OptionResponse;

public interface TableAreaService {

    List<OptionResponse> getAreas();

    OptionResponse createArea(TableAreaRequest request);

    void deleteArea(Long id);
}
