package com.pos.backend.service.Table;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.dto.request.TableArea.TableAreaRequest;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.entity.TableArea;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.TableAreaRepository;

import lombok.RequiredArgsConstructor;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TableAreaServiceImpl implements TableAreaService {

    private final TableAreaRepository tableAreaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<OptionResponse> getAreas() {
        return tableAreaRepository.findAllByOrderByNameAsc()
                .stream()
                .map(a -> OptionResponse.builder().id(a.getId()).name(a.getName()).build())
                .toList();
    }

    @Override
    @Transactional
    public OptionResponse createArea(TableAreaRequest request) {
        String name = request.getName().trim();

        if (tableAreaRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(ErrorCode.TABLE_AREA_NAME_ALREADY_EXISTS);
        }

        TableArea area = TableArea.builder().name(name).build();
        area = tableAreaRepository.save(area);

        return OptionResponse.builder().id(area.getId()).name(area.getName()).build();
    }

    @Override
    @Transactional
    public void deleteArea(Long id) {
        TableArea area = tableAreaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TABLE_AREA_NOT_FOUND));
        tableAreaRepository.delete(area);
    }
}
